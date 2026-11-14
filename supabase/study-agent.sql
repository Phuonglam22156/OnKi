-- Server-only atomic admission control. No questions, tokens or prompts are stored.
create table if not exists public.study_agent_limits (
  bucket text primary key,
  requests integer not null default 0 check (requests >= 0),
  updated_at timestamptz not null default now()
);
alter table public.study_agent_limits enable row level security;
revoke all on public.study_agent_limits from public, anon, authenticated;
grant select, insert, update, delete on public.study_agent_limits to service_role;

create or replace function public.reserve_study_agent_request(requested_user uuid)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  stamp timestamptz := now();
  date_key text := to_char(now() at time zone 'UTC', 'YYYY-MM-DD');
  month_key text := 'month:' || to_char(now() at time zone 'UTC', 'YYYY-MM');
  day_key text := 'day:' || date_key;
  user_key text := 'user:' || requested_user::text || ':' || date_key;
  user_row public.study_agent_limits%rowtype;
begin
  if requested_user is null then raise exception 'User required'; end if;
  -- Serializes reservation only, not the model request; caps hold across all instances.
  perform pg_catalog.pg_advisory_xact_lock(69714, 1);
  select * into user_row from public.study_agent_limits where bucket = user_key;
  if user_row.updated_at > stamp - interval '15 seconds' then return 'wait'; end if;
  if coalesce(user_row.requests, 0) >= 10 then return 'user_limit'; end if;
  if coalesce((select requests from public.study_agent_limits where bucket=day_key),0) >= 20 then return 'daily_limit'; end if;
  if coalesce((select requests from public.study_agent_limits where bucket=month_key),0) >= 100 then return 'monthly_limit'; end if;
  insert into public.study_agent_limits(bucket, requests, updated_at)
    select key, 1, stamp from unnest(array[user_key, day_key, month_key]) as key
    on conflict (bucket) do update set requests = study_agent_limits.requests + 1, updated_at=excluded.updated_at;
  delete from public.study_agent_limits where updated_at < stamp - interval '62 days';
  return 'ok';
end $$;
revoke all on function public.reserve_study_agent_request(uuid) from public, anon, authenticated;
grant execute on function public.reserve_study_agent_request(uuid) to service_role;
