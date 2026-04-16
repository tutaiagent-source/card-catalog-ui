alter table public.cards
add column if not exists competition text;

update public.cards
set
  competition = sport,
  sport = 'Soccer'
where lower(trim(coalesce(sport, ''))) in (
  'premier league',
  'english premier league',
  'epl',
  'la liga',
  'laliga',
  'bundesliga',
  'serie a',
  'ligue 1',
  'mls',
  'major league soccer',
  'nwsl',
  'national women''s soccer league',
  'national womens soccer league',
  'liga f',
  'saudi pro league',
  'spl',
  'uefa champions league',
  'champions league',
  'ucl',
  'uefa europa league',
  'europa league',
  'fifa world cup',
  'world cup',
  'uefa euro',
  'euro',
  'copa america',
  'copa américa',
  'women''s world cup',
  'womens world cup',
  'fifa women''s world cup',
  'fifa womens world cup'
);
