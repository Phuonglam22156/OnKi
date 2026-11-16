begin;
create table public.shared_subjects (
 code text primary key check(length(code) between 1 and 40),
 label text not null check(length(btrim(label)) between 1 and 40),
 created_at timestamptz not null default now()
);
alter table public.shared_subjects enable row level security;
revoke all on public.shared_subjects from public, anon, authenticated;
grant select on public.shared_subjects to anon, authenticated;
grant insert on public.shared_subjects to authenticated;
create policy "Everyone reads course folders" on public.shared_subjects for select to anon, authenticated using(true);
create policy "Only content admins create course folders" on public.shared_subjects for insert to authenticated
 with check(exists(select 1 from public.content_admins where user_id=(select auth.uid())));
insert into public.shared_subjects(code,label) values
 ('DBS401','DBS401 · Bảo mật CSDL'),('MLN122','MLN122 · Kinh tế chính trị Mác – Lênin');
alter table public.shared_decks add column subject_code text generated always as (
 coalesce(upper(substring(btrim(data->>'subject') from '^([A-Za-z]{2,}[0-9]{2,})\y')),
 lower(regexp_replace(btrim(data->>'subject'),'\s+',' ','g')))
) stored;
-- Preserve folders for exams published before the folder interface existed.
insert into public.shared_subjects(code,label)
 select subject_code,min(data->>'subject') from public.shared_decks group by subject_code on conflict(code) do nothing;
alter table public.shared_decks alter column subject_code set not null;
alter table public.shared_decks add constraint shared_decks_subject_folder_fkey foreign key(subject_code) references public.shared_subjects(code);
create index shared_decks_subject_code_idx on public.shared_decks(subject_code);
commit;
