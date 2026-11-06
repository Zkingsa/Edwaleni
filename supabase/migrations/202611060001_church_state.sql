create table if not exists public.church_state (
  id integer primary key check (id = 1),
  revision bigint not null default 0,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.church_state enable row level security;

revoke all on public.church_state from anon, authenticated;
grant select, insert, update on public.church_state to service_role;

create or replace function public.save_church_state(
  p_id integer,
  p_expected_revision bigint,
  p_payload jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_revision bigint;
begin
  if p_id <> 1 then
    raise exception 'Invalid church state identifier';
  end if;

  if p_expected_revision = 0 then
    insert into public.church_state (id, revision, payload)
    values (p_id, 1, p_payload)
    on conflict (id) do nothing
    returning revision into next_revision;
  else
    update public.church_state
    set payload = p_payload,
        revision = revision + 1,
        updated_at = now()
    where id = p_id and revision = p_expected_revision
    returning revision into next_revision;
  end if;

  if next_revision is null then
    raise exception 'Church data changed in another request. Reload and retry your changes.';
  end if;

  return next_revision;
end;
$$;

revoke all on function public.save_church_state(integer, bigint, jsonb) from public, anon, authenticated;
grant execute on function public.save_church_state(integer, bigint, jsonb) to service_role;
