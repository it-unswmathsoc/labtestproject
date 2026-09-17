-- The answer syntax a lab test expects students to type in.
-- Mirrors lib/math/syntax/types.ts:
--   numbas -> set(1,2,3), case-insensitive, implicit multiplication allowed
--   maple  -> {1,2,3},    case-sensitive,   explicit * required
--   latex  -> \{1,2,3\},  case-sensitive
create domain public.answer_syntax as text
  check (value in ('numbas', 'maple', 'latex'));

-- Defaulted, so existing rows keep grading exactly as they did before.
alter table public.lab_tests
  add column answer_syntax public.answer_syntax not null default 'numbas';
