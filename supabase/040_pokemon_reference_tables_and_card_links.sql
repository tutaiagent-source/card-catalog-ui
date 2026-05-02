-- Pokémon integration (shared CardCat lifecycle)
-- Adds reference tables (pokemon_sets, pokemon_prints) and links them to user cards.

-- 1) Pokémon reference data
create table if not exists public.pokemon_sets (
  id uuid primary key default gen_random_uuid(),
  set_code text not null unique,
  set_name_en text not null,
  set_name_ja text,
  release_date date,
  era text,
  set_type text,
  total_cards int,
  default_language text not null default 'en',
  created_at timestamptz not null default now()
);

create table if not exists public.pokemon_prints (
  id uuid primary key default gen_random_uuid(),
  pokemon_set_id uuid not null references public.pokemon_sets(id) on delete cascade,
  collector_number_raw text not null,
  collector_number_sort int,

  card_name_en text not null,
  card_name_ja text,

  rarity_class text,
  variant_type text,
  finish_type text,

  language text not null default 'en',

  artist text,
  supertype text,
  subtype text,

  image_url text,
  source_id text,

  created_at timestamptz not null default now(),

  -- Keep this flexible: different finish/variant categories can exist.
  unique (pokemon_set_id, collector_number_raw, language, variant_type, rarity_class, finish_type)
);

create index if not exists pokemon_prints_set_idx on public.pokemon_prints(pokemon_set_id);
create index if not exists pokemon_prints_sort_idx on public.pokemon_prints(pokemon_set_id, collector_number_sort);

-- 2) Link Pokémon reference prints to the shared user card table.
alter table public.cards
  add column if not exists game text not null default 'sports'
  check (game in ('sports', 'pokemon'));

alter table public.cards
  add column if not exists pokemon_print_id uuid references public.pokemon_prints(id) on delete set null;

alter table public.cards
  add column if not exists language text not null default 'en';

alter table public.cards
  add column if not exists display_title text not null default '';

-- Store the collector/print number as a text string (can include slashes/letters like SV94, 12/102, etc.)
alter table public.cards
  add column if not exists collector_number_raw text not null default '';
