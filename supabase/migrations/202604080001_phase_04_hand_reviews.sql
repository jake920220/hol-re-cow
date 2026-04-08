create table if not exists public.hand_reviews (
  post_id uuid primary key references public.posts(id) on delete cascade,
  game_type text,
  stakes_label text,
  hero_position text,
  hero_cards text[],
  board_flop text[],
  board_turn text,
  board_river text,
  action_summary text,
  question text,
  result_summary text,
  constraint hand_reviews_hero_cards_count_check check (
    hero_cards is null or coalesce(array_length(hero_cards, 1), 0) = 2
  ),
  constraint hand_reviews_board_flop_count_check check (
    board_flop is null or coalesce(array_length(board_flop, 1), 0) = 3
  )
);

create index if not exists hand_reviews_game_type_idx
  on public.hand_reviews (game_type);

alter table public.hand_reviews enable row level security;

drop policy if exists hand_reviews_visible_read on public.hand_reviews;
create policy hand_reviews_visible_read
on public.hand_reviews
for select
using (
  exists (
    select 1
    from public.posts
    where posts.id = hand_reviews.post_id
      and (posts.status = 'published' or posts.author_id = auth.uid())
  )
);

drop policy if exists hand_reviews_owner_insert on public.hand_reviews;
create policy hand_reviews_owner_insert
on public.hand_reviews
for insert
with check (
  exists (
    select 1
    from public.posts
    where posts.id = hand_reviews.post_id
      and posts.author_id = auth.uid()
  )
);

drop policy if exists hand_reviews_owner_update on public.hand_reviews;
create policy hand_reviews_owner_update
on public.hand_reviews
for update
using (
  exists (
    select 1
    from public.posts
    where posts.id = hand_reviews.post_id
      and posts.author_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.posts
    where posts.id = hand_reviews.post_id
      and posts.author_id = auth.uid()
  )
);

drop policy if exists hand_reviews_owner_delete on public.hand_reviews;
create policy hand_reviews_owner_delete
on public.hand_reviews
for delete
using (
  exists (
    select 1
    from public.posts
    where posts.id = hand_reviews.post_id
      and posts.author_id = auth.uid()
  )
);
