-- Atomic sibling renumbering for admin drag-and-drop.
-- security invoker so the admin RLS policies still apply: these are not a bypass.
-- WITH ORDINALITY is 1-based, matching lib/data/fixtures.ts and the reorder reducers
-- in lib/admin/content-store.ts, which all number from 1.

create or replace function public.reorder_lab_tests(p_course_id uuid, p_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.lab_tests t
  set sort_order = u.ord
  from unnest(p_ids) with ordinality as u(id, ord)
  where t.id = u.id and t.course_id = p_course_id;
$$;

create or replace function public.reorder_questions(p_lab_test_id uuid, p_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.questions q
  set sort_order = u.ord, number = u.ord
  from unnest(p_ids) with ordinality as u(id, ord)
  where q.id = u.id and q.lab_test_id = p_lab_test_id;
$$;

create or replace function public.reorder_parts(p_question_id uuid, p_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.question_parts p
  set sort_order = u.ord
  from unnest(p_ids) with ordinality as u(id, ord)
  where p.id = u.id and p.question_id = p_question_id;
$$;

create or replace function public.reorder_steps(p_part_id uuid, p_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.steps s
  set sort_order = u.ord, number = u.ord
  from unnest(p_ids) with ordinality as u(id, ord)
  where s.id = u.id and s.part_id = p_part_id;
$$;

create or replace function public.reorder_hints(p_step_id uuid, p_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.hints h
  set sort_order = u.ord, number = u.ord
  from unnest(p_ids) with ordinality as u(id, ord)
  where h.id = u.id and h.step_id = p_step_id;
$$;

-- Postgres grants EXECUTE to PUBLIC by default; revoke before granting.
revoke execute on function public.reorder_lab_tests(uuid, uuid[]) from public, anon;
revoke execute on function public.reorder_questions(uuid, uuid[]) from public, anon;
revoke execute on function public.reorder_parts(uuid, uuid[])     from public, anon;
revoke execute on function public.reorder_steps(uuid, uuid[])     from public, anon;
revoke execute on function public.reorder_hints(uuid, uuid[])     from public, anon;

grant execute on function public.reorder_lab_tests(uuid, uuid[]) to authenticated;
grant execute on function public.reorder_questions(uuid, uuid[]) to authenticated;
grant execute on function public.reorder_parts(uuid, uuid[])     to authenticated;
grant execute on function public.reorder_steps(uuid, uuid[])     to authenticated;
grant execute on function public.reorder_hints(uuid, uuid[])     to authenticated;
