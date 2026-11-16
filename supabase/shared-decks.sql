-- Shared exam publishing. Admin membership is provisioned by the project owner,
-- never by user-editable profile metadata or a browser request.
begin;
create table public.content_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.content_admins enable row level security;
revoke all on public.content_admins from public, anon, authenticated;
grant select on public.content_admins to anon, authenticated;
create policy "Read own content admin membership" on public.content_admins
 for select to authenticated using (user_id = (select auth.uid()));

create table public.shared_decks (
 id text primary key check (id ~ '^d[0-9a-z-]{1,65}$'),
 data jsonb not null check (
  data ?& array['id','title','subject','cards'] and jsonb_typeof(data)='object' and octet_length(data::text)<=1750000
  and data->>'id'=id and length(data->>'title') between 1 and 90
  and length(data->>'subject') between 1 and 40
  and jsonb_typeof(data->'cards')='array'
  and jsonb_array_length(data->'cards') between 1 and 500
 ),
 published boolean not null default true,
 revision bigint not null default 1 check(revision>0),
 updated_by uuid not null references auth.users(id),
 updated_at timestamptz not null default now()
);
alter table public.shared_decks enable row level security;
create index shared_decks_updated_by_idx on public.shared_decks(updated_by);
revoke all on public.shared_decks from public, anon, authenticated;
grant select on public.shared_decks to anon, authenticated;
grant insert, update on public.shared_decks to authenticated;
create policy "Read published or manage own catalog" on public.shared_decks for select
 to anon, authenticated using (published or exists(select 1 from public.content_admins a where a.user_id=(select auth.uid())));
create policy "Admins publish shared decks" on public.shared_decks for insert to authenticated
 with check (updated_by=(select auth.uid()) and exists(select 1 from public.content_admins a where a.user_id=(select auth.uid())));
create policy "Admins update shared decks" on public.shared_decks for update to authenticated
 using (exists(select 1 from public.content_admins a where a.user_id=(select auth.uid())))
 with check (updated_by=(select auth.uid()) and exists(select 1 from public.content_admins a where a.user_id=(select auth.uid())));

create function public.publish_shared_deck(payload jsonb, visible boolean, expected_revision bigint)
returns bigint language plpgsql security invoker set search_path='' as $$
declare result_revision bigint;
begin
 if auth.uid() is null or not exists(select 1 from public.content_admins where user_id=auth.uid()) then
  raise exception 'ADMIN_REQUIRED' using errcode='42501';
 end if;
 if expected_revision=0 then
  insert into public.shared_decks(id,data,published,updated_by)
  values(payload->>'id',payload,visible,auth.uid()) on conflict(id) do nothing
  returning revision into result_revision;
 else
  update public.shared_decks set data=payload,published=visible,revision=revision+1,updated_by=auth.uid(),updated_at=now()
  where id=payload->>'id' and revision=expected_revision returning revision into result_revision;
 end if;
 if result_revision is null then raise exception 'CATALOG_CONFLICT'; end if;
 return result_revision;
end;
$$;
revoke all on function public.publish_shared_deck(jsonb,boolean,bigint) from public,anon;
grant execute on function public.publish_shared_deck(jsonb,boolean,bigint) to authenticated;
commit;
