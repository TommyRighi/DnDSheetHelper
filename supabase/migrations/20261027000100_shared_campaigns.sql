-- Fable uses only namespaced tables/functions. No existing application tables are changed.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.fable_campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null check (length(btrim(name)) between 1 and 100),
  description text not null default '' check (length(description) <= 4000),
  edition_id text not null check (edition_id in ('3.5', '4e', '5e-2014', '5.5-2024')),
  created_at timestamptz not null default now()
);
create table public.fable_members (
  campaign_id uuid not null references public.fable_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (length(btrim(display_name)) between 1 and 80),
  joined_at timestamptz not null default now(),
  primary key (campaign_id, user_id)
);
create index fable_members_user on public.fable_members(user_id);
create table public.fable_invites (
  campaign_id uuid primary key references public.fable_campaigns(id) on delete cascade,
  token text not null unique default encode(extensions.gen_random_bytes(24), 'hex')
);
create table public.fable_sheets (
  campaign_id uuid not null,
  owner_id uuid not null,
  character_id text not null check (length(character_id) between 1 and 100),
  data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 262144),
  version bigint not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, owner_id, character_id),
  foreign key (campaign_id, owner_id) references public.fable_members(campaign_id, user_id) on delete cascade
);

create function public.fable_is_member(p_campaign uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.fable_members where campaign_id = p_campaign and user_id = (select auth.uid()));
$$;
create function public.fable_is_dm(p_campaign uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.fable_campaigns where id = p_campaign and owner_id = (select auth.uid()));
$$;

alter table public.fable_campaigns enable row level security;
alter table public.fable_members enable row level security;
alter table public.fable_invites enable row level security;
alter table public.fable_sheets enable row level security;
revoke all on public.fable_campaigns, public.fable_members, public.fable_invites, public.fable_sheets from anon, authenticated;
grant select on public.fable_campaigns, public.fable_members, public.fable_invites, public.fable_sheets to authenticated;
create policy fable_campaign_read on public.fable_campaigns for select to authenticated using (public.fable_is_member(id));
create policy fable_member_read on public.fable_members for select to authenticated using (user_id = (select auth.uid()) or public.fable_is_dm(campaign_id));
create policy fable_invite_read on public.fable_invites for select to authenticated using (public.fable_is_dm(campaign_id));
create policy fable_sheet_read on public.fable_sheets for select to authenticated using (public.fable_is_member(campaign_id) and (owner_id = (select auth.uid()) or public.fable_is_dm(campaign_id)));

-- All writes go through bounded RPCs; client roles have no direct write grants.
create function public.fable_create_campaign(p_name text, p_description text, p_edition text, p_display_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Accesso richiesto.' using errcode = '42501'; end if;
  insert into public.fable_campaigns(owner_id, name, description, edition_id)
    values(auth.uid(), btrim(p_name), p_description, p_edition) returning id into v_id;
  insert into public.fable_members values(v_id, auth.uid(), btrim(p_display_name), now());
  insert into public.fable_invites(campaign_id) values(v_id);
  return v_id;
end; $$;

create function public.fable_join_campaign(p_token text, p_display_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Accesso richiesto.' using errcode = '42501'; end if;
  select campaign_id into v_id from public.fable_invites where token = p_token;
  if v_id is null then raise exception 'Invito non valido.' using errcode = '22023'; end if;
  perform 1 from public.fable_campaigns where id = v_id for update;
  if (select count(*) from public.fable_members where campaign_id = v_id) >= 64
     and not exists(select 1 from public.fable_members where campaign_id = v_id and user_id = auth.uid()) then
    raise exception 'Campagna al completo.' using errcode = '22023';
  end if;
  insert into public.fable_members(campaign_id, user_id, display_name) values(v_id, auth.uid(), btrim(p_display_name))
    on conflict(campaign_id, user_id) do update set display_name = excluded.display_name;
  return v_id;
end; $$;

create function public.fable_rotate_invite(p_campaign uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare v_token text;
begin
  if not public.fable_is_dm(p_campaign) then raise exception 'Operazione riservata al master.' using errcode = '42501'; end if;
  update public.fable_invites set token = encode(extensions.gen_random_bytes(24), 'hex') where campaign_id = p_campaign returning token into v_token;
  return v_token;
end; $$;

create function public.fable_save_sheet(p_campaign uuid, p_data jsonb, p_expected_version bigint default null)
returns setof public.fable_sheets language plpgsql security definer set search_path = '' as $$
declare v_edition text; v_id text; v_version bigint;
begin
  if not public.fable_is_member(p_campaign) then raise exception 'Accesso alla campagna non consentito.' using errcode = '42501'; end if;
  select edition_id into v_edition from public.fable_campaigns where id = p_campaign;
  v_id := p_data->>'id';
  if jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text) > 262144
     or jsonb_typeof(p_data->'id') is distinct from 'string' or length(v_id) not between 1 and 100
     or p_data->>'editionId' is distinct from v_edition
     or jsonb_typeof(p_data->'name') is distinct from 'string' or length(btrim(p_data->>'name')) not between 1 and 35 then
    raise exception 'Scheda non valida o regolamento diverso dalla campagna.' using errcode = '22023';
  end if;
  -- Serialize all writes by this member, including concurrent first-time publication.
  perform 1 from public.fable_members where campaign_id = p_campaign and user_id = auth.uid() for update;
  select version into v_version from public.fable_sheets where campaign_id = p_campaign and owner_id = auth.uid() and character_id = v_id for update;
  if v_version is null then
    if p_expected_version is not null then raise exception 'La scheda condivisa non esiste più.' using errcode = 'PT409'; end if;
    insert into public.fable_sheets(campaign_id, owner_id, character_id, data) values(p_campaign, auth.uid(), v_id, p_data);
  else
    if p_expected_version is distinct from v_version then raise exception 'La scheda online è stata modificata da un altro dispositivo.' using errcode = 'PT409'; end if;
    update public.fable_sheets set data = p_data, version = version + 1, updated_at = now()
      where campaign_id = p_campaign and owner_id = auth.uid() and character_id = v_id;
  end if;
  return query select * from public.fable_sheets where campaign_id = p_campaign and owner_id = auth.uid() and character_id = v_id;
end; $$;

create function public.fable_unshare_sheet(p_campaign uuid, p_character text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.fable_is_member(p_campaign) then raise exception 'Accesso alla campagna non consentito.' using errcode = '42501'; end if;
  delete from public.fable_sheets where campaign_id = p_campaign and owner_id = auth.uid() and character_id = p_character;
end; $$;

create function public.fable_remove_member(p_campaign uuid, p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.fable_is_dm(p_campaign) or p_user = auth.uid() then raise exception 'Operazione non consentita.' using errcode = '42501'; end if;
  delete from public.fable_members where campaign_id = p_campaign and user_id = p_user;
end; $$;
create function public.fable_leave_campaign(p_campaign uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if public.fable_is_dm(p_campaign) then raise exception 'Il master non può abbandonare la propria campagna.' using errcode = '22023'; end if;
  delete from public.fable_members where campaign_id = p_campaign and user_id = auth.uid();
end; $$;

revoke all on function public.fable_is_member(uuid), public.fable_is_dm(uuid),
 public.fable_create_campaign(text,text,text,text), public.fable_join_campaign(text,text), public.fable_rotate_invite(uuid),
 public.fable_save_sheet(uuid,jsonb,bigint), public.fable_unshare_sheet(uuid,text), public.fable_remove_member(uuid,uuid), public.fable_leave_campaign(uuid) from public, anon;
grant execute on function public.fable_is_member(uuid), public.fable_is_dm(uuid),
 public.fable_create_campaign(text,text,text,text), public.fable_join_campaign(text,text), public.fable_rotate_invite(uuid),
 public.fable_save_sheet(uuid,jsonb,bigint), public.fable_unshare_sheet(uuid,text), public.fable_remove_member(uuid,uuid), public.fable_leave_campaign(uuid) to authenticated;

-- Realtime reads are filtered by the same row policies as ordinary queries.
alter publication supabase_realtime add table public.fable_campaigns, public.fable_members, public.fable_sheets;
