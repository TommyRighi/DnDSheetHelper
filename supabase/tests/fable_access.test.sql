begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(14);
insert into auth.users(id, email) values
 ('10000000-0000-0000-0000-000000000001','fable-dm@example.test'),
 ('10000000-0000-0000-0000-000000000002','fable-player@example.test'),
 ('10000000-0000-0000-0000-000000000003','fable-outsider@example.test');
insert into fable_campaigns(id, owner_id, name, edition_id) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Test','5e-2014');
insert into fable_members(campaign_id,user_id,display_name) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','DM'),
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','Player');
insert into fable_invites values ('20000000-0000-0000-0000-000000000001', repeat('a',48));
insert into fable_sheets(campaign_id,owner_id,character_id,data) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','dm-character','{"id":"dm-character","name":"DM","editionId":"5e-2014"}'),
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','player-character','{"id":"player-character","name":"Player","editionId":"5e-2014"}');
set local role anon;
select throws_ok('select * from public.fable_sheets','42501',null,'signed-out users cannot read sheets');
select ok(not has_function_privilege('anon','public.fable_join_campaign(text,text)','EXECUTE'),'signed-out users cannot join');
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
select is((select count(*) from fable_sheets),0::bigint,'outsider sees no sheets');
select is((select count(*) from fable_campaigns),0::bigint,'outsider sees no campaigns');
select throws_ok($$select public.fable_save_sheet('20000000-0000-0000-0000-000000000001','{"id":"x","name":"X","editionId":"5e-2014"}',null)$$,'42501',null,'outsider cannot publish');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
select is((select count(*) from fable_sheets),1::bigint,'player only sees their own sheet');
select is((select count(*) from fable_invites),0::bigint,'player cannot read invites');
select throws_ok('update fable_sheets set version=99','42501',null,'direct updates cannot bypass version checks');
select throws_ok($$select public.fable_rotate_invite('20000000-0000-0000-0000-000000000001')$$,'42501',null,'player cannot rotate invitations');
select throws_ok($$select public.fable_save_sheet('20000000-0000-0000-0000-000000000001','{"id":"player-character","name":"Player","editionId":"5e-2014"}',99)$$,'PT409',null,'stale versions cannot overwrite sheets');
select lives_ok($$select public.fable_save_sheet('20000000-0000-0000-0000-000000000001','{"id":"player-character","name":"Changed","editionId":"5e-2014"}',1)$$,'owner can update their sheet');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
select is((select count(*) from fable_sheets),2::bigint,'master reads all campaign sheets');
select is((select count(*) from fable_invites),1::bigint,'master can read their invitation');
select lives_ok($$select public.fable_remove_member('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002')$$,'master can revoke a player');
select * from finish();
rollback;
