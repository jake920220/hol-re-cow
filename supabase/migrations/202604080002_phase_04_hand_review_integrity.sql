create or replace function public.hand_review_cards_are_unique(
  hero_cards text[],
  board_flop text[],
  board_turn text,
  board_river text
)
returns boolean
language sql
immutable
as $$
  with all_cards as (
    select lower(card) as card
    from unnest(coalesce(hero_cards, array[]::text[])) as cards(card)
    where card is not null

    union all

    select lower(card) as card
    from unnest(coalesce(board_flop, array[]::text[])) as cards(card)
    where card is not null

    union all

    select lower(board_turn)
    where board_turn is not null

    union all

    select lower(board_river)
    where board_river is not null
  )
  select count(*) = count(distinct card)
  from all_cards;
$$;

create or replace function public.validate_hand_review_cards()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.hand_review_cards_are_unique(
    new.hero_cards,
    new.board_flop,
    new.board_turn,
    new.board_river
  ) then
    raise exception 'hand review cards must be unique'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists hand_reviews_validate_cards on public.hand_reviews;
create trigger hand_reviews_validate_cards
before insert or update on public.hand_reviews
for each row
execute function public.validate_hand_review_cards();

create or replace function public.assert_hand_review_post_consistency(target_post_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  target_post_type text;
  has_hand_review boolean;
begin
  if target_post_id is null then
    return;
  end if;

  select post_type
    into target_post_type
  from public.posts
  where id = target_post_id;

  if not found then
    return;
  end if;

  select exists(
    select 1
    from public.hand_reviews
    where post_id = target_post_id
  )
    into has_hand_review;

  if target_post_type = 'hand_review' and not has_hand_review then
    raise exception 'hand_review posts require companion hand_reviews rows'
      using errcode = '23514';
  end if;

  if target_post_type <> 'hand_review' and has_hand_review then
    raise exception 'hand_reviews rows must reference hand_review posts'
      using errcode = '23514';
  end if;
end;
$$;

create or replace function public.enforce_hand_review_post_consistency()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_table_name = 'posts' then
    perform public.assert_hand_review_post_consistency(new.id);
    return new;
  end if;

  if tg_op = 'DELETE' then
    perform public.assert_hand_review_post_consistency(old.post_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and old.post_id is distinct from new.post_id then
    perform public.assert_hand_review_post_consistency(old.post_id);
  end if;

  perform public.assert_hand_review_post_consistency(new.post_id);
  return new;
end;
$$;

drop trigger if exists posts_hand_review_consistency on public.posts;
create constraint trigger posts_hand_review_consistency
after insert or update of post_type on public.posts
deferrable initially deferred
for each row
execute function public.enforce_hand_review_post_consistency();

drop trigger if exists hand_reviews_post_consistency on public.hand_reviews;
create constraint trigger hand_reviews_post_consistency
after insert or update or delete on public.hand_reviews
deferrable initially deferred
for each row
execute function public.enforce_hand_review_post_consistency();

create or replace function public.create_hand_review_post(
  input_status text,
  input_title text,
  input_body text,
  input_game_type text,
  input_stakes_label text,
  input_hero_position text,
  input_hero_cards text[],
  input_board_flop text[],
  input_board_turn text,
  input_board_river text,
  input_action_summary text,
  input_question text,
  input_result_summary text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  created_post_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  insert into public.posts (
    author_id,
    post_type,
    status,
    title,
    body
  )
  values (
    auth.uid(),
    'hand_review',
    input_status,
    input_title,
    coalesce(input_body, '')
  )
  returning id into created_post_id;

  insert into public.hand_reviews (
    post_id,
    game_type,
    stakes_label,
    hero_position,
    hero_cards,
    board_flop,
    board_turn,
    board_river,
    action_summary,
    question,
    result_summary
  )
  values (
    created_post_id,
    input_game_type,
    input_stakes_label,
    input_hero_position,
    input_hero_cards,
    input_board_flop,
    input_board_turn,
    input_board_river,
    input_action_summary,
    input_question,
    input_result_summary
  );

  return created_post_id;
end;
$$;
