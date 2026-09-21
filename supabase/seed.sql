-- MATH1081 Lab Test 1, transcribed from lib/data/fixtures.ts.
-- UUIDs are literal so ids (and therefore /tests/[testId] URLs) survive a db reset.
-- Lab Test 2 is deliberately left unpublished: it is what makes the anon RLS
-- checks in scripts/verify-rls.ts meaningful.

insert into public.courses (id, code, name, description, sort_order) values
  ('c0000000-0000-4000-8000-000000001081', 'MATH1081', 'Discrete Mathematics',
   'Sets, logic, number theory, graphs and combinatorics.', 1),
  ('c0000000-0000-4000-8000-000000001141', 'MATH1141', 'Higher Mathematics 1A',
   'Calculus and linear algebra (higher stream).', 2);

insert into public.lab_tests (id, course_id, name, term, description, is_published, sort_order, answer_syntax) values
  ('7e570000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000001081',
   'Lab Test 1', '2026 T1',
   'Practice questions covering sets, functions and number theory, with guided worked steps.',
   true, 1, 'numbas'),
  ('7e570000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000001081',
   'Lab Test 2', '2026 T1', 'Draft — not yet released to students.', false, 2, 'numbas');

insert into public.questions (id, lab_test_id, number, prompt_latex, note_latex, sort_order) values
  ('90e50000-0000-4000-8000-000000000001', '7e570000-0000-4000-8000-000000000001', 1,
   'In a class of 39 students: 16 study Biology, 21 study English, 10 study both Biology and English, 7 study both Biology and Maths, 12 study both English and Maths, 5 study all three subjects, and 7 study none of these subjects.',
   null, 1),
  ('90e50000-0000-4000-8000-000000000002', '7e570000-0000-4000-8000-000000000001', 2,
   'For an integer $k$, let $S_k = \{ n \in \mathbb{Z} : \tfrac{5}{4}k + 2 \le n \le \tfrac{5}{4}k + 12 \}$.',
   'Recall the Numbas syntax for a set $\{a,b,c\}$ is set(a,b,c).', 2),
  ('90e50000-0000-4000-8000-000000000003', '7e570000-0000-4000-8000-000000000001', 3,
   'Consider $f : \mathbb{R}^+_0 \to \mathbb{R}$, $f(x) = x(x+4)^2$. Complete the statement to make it logically true.',
   null, 3),
  ('90e50000-0000-4000-8000-000000000004', '7e570000-0000-4000-8000-000000000001', 4,
   'Let $S = \{0,1,2,3,4,5,6,7\}$ and $f : S \to S$ the shift $f(x) = (x+3) \bmod 8$.',
   null, 4),
  ('90e50000-0000-4000-8000-000000000008', '7e570000-0000-4000-8000-000000000001', 8,
   'For the arrow diagram shown, indicate whether the relation is reflexive, symmetric, and/or transitive.',
   null, 5);

insert into public.question_parts
  (id, question_id, label, prompt_latex, image_url, image_alt, answer_type, answer_value, answer_config, sort_order)
values
  ('9a570000-0000-4000-8000-000000000011', '90e50000-0000-4000-8000-000000000001',
   'a', 'How many students study Maths?', null, null, 'integer', '19', null, 1),
  ('9a570000-0000-4000-8000-000000000012', '90e50000-0000-4000-8000-000000000001',
   'b', 'Evaluate $|B^c \cup (E^c \cap M^c)^c|$.', null, null, 'integer', '35', null, 2),
  ('9a570000-0000-4000-8000-000000000021', '90e50000-0000-4000-8000-000000000002',
   'a', 'What is $S_5 - S_1$?', null, null,
   'set_of_integers', '[14,15,16,17,18]', null, 1),
  ('9a570000-0000-4000-8000-000000000022', '90e50000-0000-4000-8000-000000000002',
   'b.i', 'Find $|\mathcal{P}(S_1 \times S_5)|$.', null, null,
   'expression', '{"mobius":"2^100"}', null, 2),
  ('9a570000-0000-4000-8000-000000000031', '90e50000-0000-4000-8000-000000000003',
   'a', 'Since the equation $f(x) = a$ has the following number of solutions, we conclude $f$ is:',
   null, null, 'single_choice', '{"choice":"not_surjective"}',
   '{"options":[{"value":"injective","label":"injective"},{"value":"surjective","label":"surjective"},{"value":"not_injective","label":"not injective"},{"value":"not_surjective","label":"not surjective"}]}',
   1),
  ('9a570000-0000-4000-8000-000000000041', '90e50000-0000-4000-8000-000000000004',
   'c', 'Classify $f$.', null, null, 'text', '{"text":"Bijective"}', null, 1),
  ('9a570000-0000-4000-8000-000000000081', '90e50000-0000-4000-8000-000000000008',
   'a', 'Select all properties that hold.',
   '/questions/math1081-lt1-q8a.png',
   'Arrow diagram on four nodes labelled 1 to 4, showing the relation for part (a).',
   'multi_select', '{"selected":["reflexive","symmetric","transitive"]}',
   '{"options":[{"value":"reflexive","label":"Reflexive"},{"value":"symmetric","label":"Symmetric"},{"value":"transitive","label":"Transitive"}]}',
   1);

insert into public.steps
  (id, part_id, number, prompt_latex, answer_type, answer_value, answer_config, explanation_latex, sort_order)
values
  ('57e70000-0000-4000-8000-000000000111', '9a570000-0000-4000-8000-000000000011', 1,
   'First find $|B \cup E \cup M|$: how many students study at least one subject?',
   'integer', '32', null,
   'Since 7 students study none, $|B \cup E \cup M| = 39 - 7 = 32$.', 1),
  ('57e70000-0000-4000-8000-000000000112', '9a570000-0000-4000-8000-000000000011', 2,
   'Now solve for $|M|$ using inclusion–exclusion. What is $|M|$?',
   'integer', '19', null,
   '$32 = 16 + 21 + |M| - 10 - 12 - 7 + 5$, so $|M| = 19$.', 2);

insert into public.hints (id, step_id, number, body_latex, sort_order) values
  ('41070000-0000-4000-8000-000000001111', '57e70000-0000-4000-8000-000000000111', 1,
   'The total class size minus those studying none gives the union.', 1);
