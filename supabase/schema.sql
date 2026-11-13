-- Run once in the SQL Editor of the dedicated OnKi Supabase project.
begin;
create table if not exists public.study_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 2000000),
 revision bigint not null default 1 check(revision > 0),
 updated_at timestamptz not null default now()
);
alter table public.study_state enable row level security;
revoke all on public.study_state from anon;
grant select, insert, update on public.study_state to authenticated;
drop policy if exists "Read own study state" on public.study_state;
create policy "Read own study state" on public.study_state for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Insert own study state" on public.study_state;
create policy "Insert own study state" on public.study_state for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Update own study state" on public.study_state;
create policy "Update own study state" on public.study_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create or replace function public.save_study_state(payload jsonb, expected_revision bigint)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare result_revision bigint;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if expected_revision < 0 then raise exception 'Invalid revision'; end if;
 if expected_revision = 0 then
  insert into public.study_state(user_id,data,revision) values(auth.uid(),payload,1)
  on conflict(user_id) do nothing returning revision into result_revision;
 else
  update public.study_state set data=payload, revision=revision+1, updated_at=now()
  where user_id=auth.uid() and revision=expected_revision returning revision into result_revision;
 end if;
 if result_revision is null then raise exception 'STATE_CONFLICT' using errcode='P0001'; end if;
 return result_revision;
end;
$$;
revoke all on function public.save_study_state(jsonb,bigint) from public,anon;
grant execute on function public.save_study_state(jsonb,bigint) to authenticated;
commit;
