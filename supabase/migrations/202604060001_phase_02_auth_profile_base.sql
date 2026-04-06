create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.build_profile_handle(
  requested_handle text,
  fallback_email text,
  fallback_user_id uuid
)
returns text
language plpgsql
as $$
declare
  base_handle text;
  candidate text;
  suffix integer := 0;
begin
  base_handle := lower(
    regexp_replace(
      coalesce(nullif(requested_handle, ''), split_part(coalesce(fallback_email, ''), '@', 1), ''),
      '[^a-z0-9_]+',
      '',
      'g'
    )
  );

  if char_length(base_handle) < 3 then
    base_handle := 'player_' || left(replace(fallback_user_id::text, '-', ''), 8);
  end if;

  base_handle := left(base_handle, 20);
  candidate := base_handle;

  while exists (
    select 1
    from public.profiles
    where lower(handle) = lower(candidate)
  ) loop
    suffix := suffix + 1;
    candidate :=
      left(base_handle, greatest(1, 20 - length(suffix::text) - 1))
      || '_'
      || suffix::text;
  end loop;

  return candidate;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null,
  display_name text not null,
  avatar_path text,
  bio text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_handle_format check (handle ~ '^[a-z0-9_]{3,20}$')
);

create unique index if not exists profiles_handle_key
  on public.profiles (lower(handle));

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create index if not exists follows_following_id_idx
  on public.follows (following_id);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  post_type text not null,
  status text not null default 'published',
  title text,
  body text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint posts_post_type_check check (post_type in ('hand_review', 'free_post')),
  constraint posts_status_check check (status in ('draft', 'published'))
);

create index if not exists posts_author_id_created_at_idx
  on public.posts (author_id, created_at desc);

create index if not exists posts_post_type_created_at_idx
  on public.posts (post_type, created_at desc);

create index if not exists posts_status_created_at_idx
  on public.posts (status, created_at desc);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at
before update on public.posts
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  derived_display_name text;
  generated_handle text;
begin
  derived_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    '홀리카우 플레이어'
  );

  generated_handle := public.build_profile_handle(
    new.raw_user_meta_data ->> 'handle',
    new.email,
    new.id
  );

  insert into public.profiles (id, handle, display_name)
  values (new.id, generated_handle, derived_display_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.posts enable row level security;

drop policy if exists profiles_public_read on public.profiles;
create policy profiles_public_read
on public.profiles
for select
using (true);

drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists follows_public_read on public.follows;
create policy follows_public_read
on public.follows
for select
using (true);

drop policy if exists follows_owner_insert on public.follows;
create policy follows_owner_insert
on public.follows
for insert
with check (auth.uid() = follower_id);

drop policy if exists follows_owner_delete on public.follows;
create policy follows_owner_delete
on public.follows
for delete
using (auth.uid() = follower_id);

drop policy if exists posts_visible_read on public.posts;
create policy posts_visible_read
on public.posts
for select
using (status = 'published' or auth.uid() = author_id);

drop policy if exists posts_owner_insert on public.posts;
create policy posts_owner_insert
on public.posts
for insert
with check (auth.uid() = author_id);

drop policy if exists posts_owner_update on public.posts;
create policy posts_owner_update
on public.posts
for update
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

drop policy if exists posts_owner_delete on public.posts;
create policy posts_owner_delete
on public.posts
for delete
using (auth.uid() = author_id);
