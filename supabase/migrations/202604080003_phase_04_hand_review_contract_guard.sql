create or replace function public.hand_review_card_token_is_valid(card text)
returns boolean
language sql
immutable
as $$
  select card is not null
    and lower(trim(card)) ~ '^(?:[2-9tjqka]|10)[shdc]$';
$$;

create or replace function public.hand_review_card_group_tokens_are_valid(cards text[])
returns boolean
language sql
immutable
as $$
  select coalesce(
    bool_and(public.hand_review_card_token_is_valid(card)),
    true
  )
  from unnest(coalesce(cards, array[]::text[])) as cards(card);
$$;

create or replace function public.validate_hand_review_contract()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.game_type is not null
    and new.game_type not in ('cash', 'tournament') then
    raise exception 'hand review game_type is invalid'
      using errcode = '23514';
  end if;

  if new.hero_position is not null
    and new.hero_position not in ('UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB') then
    raise exception 'hand review hero_position is invalid'
      using errcode = '23514';
  end if;

  if new.hero_cards is not null and (
    coalesce(array_length(new.hero_cards, 1), 0) <> 2
    or not public.hand_review_card_group_tokens_are_valid(new.hero_cards)
  ) then
    raise exception 'hand review hero_cards must contain two valid cards'
      using errcode = '23514';
  end if;

  if new.board_flop is not null and (
    coalesce(array_length(new.board_flop, 1), 0) <> 3
    or not public.hand_review_card_group_tokens_are_valid(new.board_flop)
  ) then
    raise exception 'hand review board_flop must contain three valid cards'
      using errcode = '23514';
  end if;

  if new.board_turn is not null
    and not public.hand_review_card_token_is_valid(new.board_turn) then
    raise exception 'hand review board_turn is invalid'
      using errcode = '23514';
  end if;

  if new.board_river is not null
    and not public.hand_review_card_token_is_valid(new.board_river) then
    raise exception 'hand review board_river is invalid'
      using errcode = '23514';
  end if;

  if new.board_turn is not null and new.board_flop is null then
    raise exception 'hand review board_turn requires board_flop'
      using errcode = '23514';
  end if;

  if new.board_river is not null and new.board_turn is null then
    raise exception 'hand review board_river requires board_turn'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists hand_reviews_validate_contract on public.hand_reviews;
create trigger hand_reviews_validate_contract
before insert or update on public.hand_reviews
for each row
execute function public.validate_hand_review_contract();
