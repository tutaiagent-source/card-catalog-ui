-- Adds detailed grading metadata to cards.
-- Intended for: grading company (PSA/BGS/SGC/CGC/Other), auto-grade, and grading certificate/serial.

alter table public.cards
  alter column grade type double precision;

alter table public.cards
  add column if not exists grading_company text not null default '';

alter table public.cards
  add column if not exists auto_grade double precision;

alter table public.cards
  add column if not exists grading_cert_number_text text not null default '';
