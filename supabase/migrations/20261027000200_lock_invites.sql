-- Serialize invite validation with token rotation.
create or replace function public.fable_join_campaign(p_token text, p_display_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Accesso richiesto.' using errcode = '42501'; end if;
  select campaign_id into v_id from public.fable_invites where token = p_token for update;
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
