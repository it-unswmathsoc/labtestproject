-- Content hierarchy: course -> lab_test -> question -> question_part -> step -> hint.
-- Shared contract with the frontend; see
-- docs/superpowers/specs/2026-07-13-mathsoc-labtest-practice-frontend-design.md

create schema if not exists private;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text,
  sort_order int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index courses_code_key on public.courses (lower(code));
create index courses_sort_order_idx on public.courses (sort_order);

create table public.lab_tests (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null,
  name text not null,
  term text,
  description text,
  is_published boolean not null default false,
  sort_order int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_lab_tests_course foreign key (course_id)
    references public.courses (id) on delete cascade
);

create index lab_tests_course_id_sort_order_idx
  on public.lab_tests (course_id, sort_order);
create index lab_tests_is_published_idx on public.lab_tests (is_published);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  lab_test_id uuid not null,
  number int not null,
  prompt_latex text not null,
  note_latex text,
  sort_order int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_questions_lab_test foreign key (lab_test_id)
    references public.lab_tests (id) on delete cascade
);

create index questions_lab_test_id_sort_order_idx
  on public.questions (lab_test_id, sort_order);

-- answer_type / answer_value are used identically on parts and steps.
-- Shapes are defined by lib/grading/types.ts:
--   integer         -> 19
--   expression      -> {"mobius": "2^100"}
--   set_of_integers -> [14,15,16,17,18]
--   single_choice   -> {"choice": "not_surjective"}
--   multi_select    -> {"selected": ["reflexive","symmetric"]}
--   text            -> {"text": "Bijective"}
create domain public.answer_type as text
  check (value in (
    'integer',
    'expression',
    'set_of_integers',
    'single_choice',
    'multi_select',
    'text'
  ));

create table public.question_parts (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null,
  label text not null,
  prompt_latex text not null,
  image_url text,
  image_alt text,
  answer_type public.answer_type not null,
  answer_value jsonb not null,
  answer_config jsonb,
  sort_order int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_parts_question foreign key (question_id)
    references public.questions (id) on delete cascade
);

create index question_parts_question_id_sort_order_idx
  on public.question_parts (question_id, sort_order);

create table public.steps (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null,
  number int not null,
  prompt_latex text not null,
  answer_type public.answer_type not null,
  answer_value jsonb not null,
  answer_config jsonb,
  explanation_latex text not null default '',
  sort_order int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_steps_part foreign key (part_id)
    references public.question_parts (id) on delete cascade
);

create index steps_part_id_sort_order_idx on public.steps (part_id, sort_order);

create table public.hints (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null,
  number int not null,
  body_latex text not null,
  sort_order int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_hints_step foreign key (step_id)
    references public.steps (id) on delete cascade
);

create index hints_step_id_sort_order_idx on public.hints (step_id, sort_order);

create trigger courses_set_updated_at before update on public.courses
  for each row execute function private.set_updated_at();
create trigger lab_tests_set_updated_at before update on public.lab_tests
  for each row execute function private.set_updated_at();
create trigger questions_set_updated_at before update on public.questions
  for each row execute function private.set_updated_at();
create trigger question_parts_set_updated_at before update on public.question_parts
  for each row execute function private.set_updated_at();
create trigger steps_set_updated_at before update on public.steps
  for each row execute function private.set_updated_at();
create trigger hints_set_updated_at before update on public.hints
  for each row execute function private.set_updated_at();
