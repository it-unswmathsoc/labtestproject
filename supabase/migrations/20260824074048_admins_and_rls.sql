-- Admin membership, RLS policies and Data API grants.
-- Anon reads only rows reachable from a published lab test; admins get full CRUD.

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

-- No arguments and no user input: this only ever reveals whether the caller is an
-- admin. security definer is required because public.admins is itself RLS-protected.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

-- anon needs EXECUTE too: the SELECT policies below are `to anon, authenticated`
-- and call is_admin(), so an anon read evaluates it. It returns false for anon
-- (auth.uid() is null) and cannot enumerate admins, so this leaks nothing.
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.courses        enable row level security;
alter table public.lab_tests      enable row level security;
alter table public.questions      enable row level security;
alter table public.question_parts enable row level security;
alter table public.steps          enable row level security;
alter table public.hints          enable row level security;
alter table public.admins         enable row level security;

-- One SELECT policy per table, admitting published content or an admin. Kept as a
-- single policy rather than a public-read policy plus a FOR ALL admin policy, which
-- would stack two permissive SELECT policies for `authenticated` (lint 0006).
-- Every level walks up to lab_tests.is_published explicitly rather than relying on
-- RLS cascading through subqueries.
create policy courses_select on public.courses
  for select to anon, authenticated
  using (true);

create policy lab_tests_select on public.lab_tests
  for select to anon, authenticated
  using (is_published or (select public.is_admin()));

create policy questions_select on public.questions
  for select to anon, authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.lab_tests t
      where t.id = questions.lab_test_id and t.is_published
    )
  );

create policy question_parts_select on public.question_parts
  for select to anon, authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1
      from public.questions q
      join public.lab_tests t on t.id = q.lab_test_id
      where q.id = question_parts.question_id and t.is_published
    )
  );

create policy steps_select on public.steps
  for select to anon, authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1
      from public.question_parts p
      join public.questions q on q.id = p.question_id
      join public.lab_tests t on t.id = q.lab_test_id
      where p.id = steps.part_id and t.is_published
    )
  );

create policy hints_select on public.hints
  for select to anon, authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1
      from public.steps s
      join public.question_parts p on p.id = s.part_id
      join public.questions q on q.id = p.question_id
      join public.lab_tests t on t.id = q.lab_test_id
      where s.id = hints.step_id and t.is_published
    )
  );

-- Write policies, insert/update/delete only. `to authenticated` means anon queries
-- never evaluate is_admin(). with check is present on every update so a row cannot
-- be reparented out from under the policy.
create policy courses_admin_insert on public.courses
  for insert to authenticated with check ((select public.is_admin()));
create policy courses_admin_update on public.courses
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy courses_admin_delete on public.courses
  for delete to authenticated using ((select public.is_admin()));

create policy lab_tests_admin_insert on public.lab_tests
  for insert to authenticated with check ((select public.is_admin()));
create policy lab_tests_admin_update on public.lab_tests
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy lab_tests_admin_delete on public.lab_tests
  for delete to authenticated using ((select public.is_admin()));

create policy questions_admin_insert on public.questions
  for insert to authenticated with check ((select public.is_admin()));
create policy questions_admin_update on public.questions
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy questions_admin_delete on public.questions
  for delete to authenticated using ((select public.is_admin()));

create policy question_parts_admin_insert on public.question_parts
  for insert to authenticated with check ((select public.is_admin()));
create policy question_parts_admin_update on public.question_parts
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy question_parts_admin_delete on public.question_parts
  for delete to authenticated using ((select public.is_admin()));

create policy steps_admin_insert on public.steps
  for insert to authenticated with check ((select public.is_admin()));
create policy steps_admin_update on public.steps
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy steps_admin_delete on public.steps
  for delete to authenticated using ((select public.is_admin()));

create policy hints_admin_insert on public.hints
  for insert to authenticated with check ((select public.is_admin()));
create policy hints_admin_update on public.hints
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy hints_admin_delete on public.hints
  for delete to authenticated using ((select public.is_admin()));

-- Admins can see their own row and nothing else. There is deliberately no insert,
-- update or delete policy: membership is granted out of band with the service role,
-- which closes the self-promotion path.
create policy admins_select_self on public.admins
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Since April 2026 new public tables are not auto-exposed to the Data API.
grant usage on schema public to anon, authenticated;

grant select on
  public.courses,
  public.lab_tests,
  public.questions,
  public.question_parts,
  public.steps,
  public.hints
to anon, authenticated;

grant insert, update, delete on
  public.courses,
  public.lab_tests,
  public.questions,
  public.question_parts,
  public.steps,
  public.hints
to authenticated;

grant select on public.admins to authenticated;

-- service_role bypasses RLS but still needs table privileges, and nothing in the
-- public schema is auto-exposed any more. Used by scripts/create-admin.ts, which
-- must bypass the deliberate absence of an INSERT policy on admins.
grant all on
  public.courses,
  public.lab_tests,
  public.questions,
  public.question_parts,
  public.steps,
  public.hints,
  public.admins
to service_role;
