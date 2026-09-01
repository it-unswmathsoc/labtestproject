-- Public-read bucket for question diagrams; only admins can write.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'question-images',
  'question-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- storage.objects lives outside the public schema, so a public-schema reset leaves
-- these behind. Drop first to keep the migration re-runnable.
drop policy if exists question_images_select_public on storage.objects;
drop policy if exists question_images_insert_admin on storage.objects;
drop policy if exists question_images_update_admin on storage.objects;
drop policy if exists question_images_delete_admin on storage.objects;

create policy question_images_select_public on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'question-images');

-- Upsert needs insert + select + update; insert alone makes replacing a file
-- fail silently.
create policy question_images_insert_admin on storage.objects
  for insert to authenticated
  with check (bucket_id = 'question-images' and (select public.is_admin()));

create policy question_images_update_admin on storage.objects
  for update to authenticated
  using (bucket_id = 'question-images' and (select public.is_admin()))
  with check (bucket_id = 'question-images' and (select public.is_admin()));

create policy question_images_delete_admin on storage.objects
  for delete to authenticated
  using (bucket_id = 'question-images' and (select public.is_admin()));
