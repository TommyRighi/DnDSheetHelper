import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCloudClient, cloudResult, saveSharedSheet, cloudErrorMessage } from './cloud-client.js';
import { fingerprint, readSyncLinks, sharedCharacter, syncAction } from './cloud-sync.js';

const selectionKey = 'fable-online-campaign';
const safeRead = key => { try { return localStorage.getItem(key) || ''; } catch { return ''; } };
export default function useOnlineCampaign({ character, characters, onReceive, enabled = true }) {
  const [setup] = useState(() => { try { return { client: getCloudClient() }; } catch (error) { return { client: null, error }; } });
  const client = setup.client;
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!client);
  const [selectedId, setSelectedId] = useState(() => safeRead(selectionKey));
  const [campaigns, setCampaigns] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [members, setMembers] = useState([]);
  const [token, setToken] = useState('');
  const [error, setError] = useState(setup.error?.message || '');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [linkState, setLinkState] = useState({ key: '', links: {} });
  const [saving, setSaving] = useState(false);
  const userId = session?.user.id;
  const campaign = campaigns.find(c => c.id === selectedId) || null;
  const linkKey = userId && campaign ? `fable-sync:${userId}:${campaign.id}` : '';
  const links = linkState.key === linkKey ? linkState.links : {};
  const identity = `${userId || ''}:${selectedId}`;
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const inFlight = useRef(false);
  const failedWrites = useRef(Object.create(null));
  const receiveRef = useRef(onReceive); receiveRef.current = onReceive;

  useEffect(() => {
    if (!client) return;
    let live = true;
    client.auth.getSession().then(({ data, error }) => {
      if (!live) return;
      if (error) setError(cloudErrorMessage(error));
      setSession(data.session); setAuthReady(true);
    }).catch(e => { if (live) { setError(cloudErrorMessage(e)); setAuthReady(true); } });
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      if (live) { setSession(next); setAuthReady(true); }
    });
    return () => { live = false; data.subscription.unsubscribe(); };
  }, [client]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  useEffect(() => {
    setLinkState({ key: linkKey, links: linkKey ? readSyncLinks(localStorage, linkKey) : {} });
    failedWrites.current = Object.create(null);
  }, [linkKey]);
  const remember = useCallback((id, row, key = linkKey) => {
    setLinkState(current => {
      if (current.key !== key) return current;
      const next = Object.assign(Object.create(null), current.links);
      if (row) next[id] = { version: row.version, fingerprint: fingerprint(row.data) };
      else delete next[id];
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Keep session sync state. */ }
      return { key, links: next };
    });
  }, [linkKey]);
  const selectCampaign = useCallback(id => {
    setSelectedId(id); setSheets([]); setMembers([]); setToken(''); setError('');
    try { localStorage.setItem(selectionKey, id); } catch { /* Session selection remains available. */ }
  }, []);
  const refresh = useCallback(async () => {
    if (!client || !userId || !online) return;
    const key = `${userId}:${selectedId}`;
    const list = await cloudResult(client.from('fable_campaigns').select('*').order('created_at'));
    if (identityRef.current !== key) return;
    setCampaigns(list);
    const selected = list.find(c => c.id === selectedId);
    if (!selected) { setSheets([]); setMembers([]); setToken(''); return; }
    const [rows, people, invites] = await Promise.all([
      cloudResult(client.from('fable_sheets').select('*').eq('campaign_id', selectedId)),
      cloudResult(client.from('fable_members').select('*').eq('campaign_id', selectedId)),
      selected.owner_id === userId ? cloudResult(client.from('fable_invites').select('token').eq('campaign_id', selectedId).single()) : Promise.resolve(null),
    ]);
    if (identityRef.current !== key) return;
    const valid = [];
    for (const row of rows) {
      try { valid.push({ ...row, data: sharedCharacter(row.data) }); }
      catch { setError('Una scheda condivisa contiene dati non validi.'); }
    }
    setSheets(valid); setMembers(people); setToken(invites?.token || '');
  }, [client, userId, selectedId, online]);
  useEffect(() => {
    setSheets([]); setMembers([]); setCampaigns([]); setToken('');
    if (!userId) return;
    let live = true;
    setLoading(true);
    refresh().catch(e => { if (live) setError(cloudErrorMessage(e)); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [userId, selectedId, refresh]);
  useEffect(() => {
    if (!client || !userId || !selectedId || !online) { setConnected(false); return; }
    let timer;
    let live = true;
    const update = () => {
      clearTimeout(timer);
      timer = setTimeout(() => refresh().catch(e => { if (live) setError(cloudErrorMessage(e)); }), 120);
    };
    setConnected(false);
    const channel = client.channel(`fable:${selectedId}:${userId}`)
      .on('postgres_changes', { event: '*', schema: import.meta.env.VITE_SUPABASE_DB_SCHEMA || 'public', table: 'fable_sheets', filter: `campaign_id=eq.${selectedId}` }, update)
      .on('postgres_changes', { event: '*', schema: import.meta.env.VITE_SUPABASE_DB_SCHEMA || 'public', table: 'fable_members', filter: `campaign_id=eq.${selectedId}` }, update)
      .subscribe(status => {
        if (!live) return;
        setConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') update();
      });
    const poll = setInterval(() => { if (!document.hidden) update(); }, 15000);
    window.addEventListener('focus', update);
    return () => { live = false; clearTimeout(timer); clearInterval(poll); window.removeEventListener('focus', update); client.removeChannel(channel); };
  }, [client, userId, selectedId, online, refresh]);
  const localCharacters = useMemo(() => [character, ...characters.filter(c => c.id !== character.id)], [character, characters]);
  const ownSheets = sheets.filter(s => s.owner_id === userId);
  const conflicts = ownSheets.filter(s => {
    const local = localCharacters.find(c => c.id === s.character_id);
    return local && syncAction(local, s, Object.hasOwn(links, s.character_id) ? links[s.character_id] : undefined) === 'conflict';
  });
  useEffect(() => {
    if (!client || !campaign || !enabled || !online || loading || linkState.key !== linkKey || inFlight.current) return;
    const work = localCharacters.flatMap(local => {
      const link = Object.hasOwn(links, local.id) ? links[local.id] : undefined;
      if (!link) return [];
      const remote = sheets.find(s => s.owner_id === userId && s.character_id === local.id);
      const action = syncAction(local, remote, link);
      if (action === 'adopt' && remote.version === link.version && fingerprint(remote.data) === link.fingerprint) return [];
      if (action === 'push' && failedWrites.current[local.id] === `${link.version}:${fingerprint(local)}`) return [];
      return ['push', 'pull', 'adopt', 'removed'].includes(action) ? [{ local, remote, link, action }] : [];
    });
    if (!work.length) return;
    const key = identity;
    const timer = setTimeout(async () => {
      if (inFlight.current || identityRef.current !== key) return;
      inFlight.current = true; setSaving(true);
      try {
        for (const item of work) {
          if (identityRef.current !== key) break;
          const { local, remote, link, action } = item;
          if (action === 'removed') { remember(local.id, null); continue; }
          if (action === 'pull') receiveRef.current(remote.data);
          if (action === 'pull' || action === 'adopt') {
            if (remote.version !== link.version || fingerprint(remote.data) !== link.fingerprint) remember(local.id, remote);
          } else {
            const row = await saveSharedSheet(client, campaign.id, local, link.version);
            if (identityRef.current !== key) break;
            remember(local.id, row);
          }
        }
        if (identityRef.current === key) { failedWrites.current = Object.create(null); await refresh(); }
      } catch (e) {
        if (identityRef.current === key) {
          setError(e.code === 'PT409' ? 'Modifiche in conflitto. Scegli quale versione conservare.' : cloudErrorMessage(e));
          for (const item of work) if (item.action === 'push') failedWrites.current[item.local.id] = `${item.link.version}:${fingerprint(item.local)}`;
          await refresh().catch(() => {});
        }
      } finally { inFlight.current = false; setSaving(false); }
    }, 700);
    return () => clearTimeout(timer);
  }, [client, campaign, enabled, online, localCharacters, sheets, linkState, linkKey, identity, userId, remember, refresh, saving, loading]);

  const run = async action => { setError(''); setLoading(true); try { return await action(); } catch (e) { setError(cloudErrorMessage(e)); throw e; } finally { setLoading(false); } };
  const publish = async () => run(async () => {
    const row = ownSheets.find(s => s.character_id === character.id);
    const saved = await saveSharedSheet(client, campaign.id, character, row?.version ?? null);
    remember(character.id, saved); await refresh();
  });
  const resolve = async (row, useLocal) => run(async () => {
    let next = row;
    if (useLocal) next = await saveSharedSheet(client, campaign.id, localCharacters.find(c => c.id === row.character_id), row.version);
    else receiveRef.current(row.data);
    remember(row.character_id, next); await refresh();
  });
  return { client, configured: !!client, authReady, session, campaign, campaigns, sheets, members, token, error, loading, connected, online, saving, conflicts, links, refresh, selectCampaign, run, publish, resolve, remember,
    retry: async () => { failedWrites.current = Object.create(null); setError(''); await refresh(); },
    adopt: row => run(async () => { receiveRef.current(row.data, true); remember(row.character_id, row); }),
    isDm: !!campaign && campaign.owner_id === userId,
    unshare: row => run(async () => { await cloudResult(client.rpc('fable_unshare_sheet', { p_campaign: campaign.id, p_character: row.character_id })); remember(row.character_id, null); await refresh(); }),
    disconnect: () => selectCampaign(''),
  };
}
