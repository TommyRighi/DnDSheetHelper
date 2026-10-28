import test from 'node:test';
import assert from 'node:assert/strict';
import { exportCloudAccount, deleteCloudAccount } from './cloud-account.js';

test('account export contains the exact private attachment bytes', async () => {
  const client = { rpc: async () => ({ data: { assets: [{ object_name: 'private/file' }] } }), storage: { from: () => ({ download: async () => ({ data: new Blob([Uint8Array.of(0,255,137)]) }) }) } };
  const data = await exportCloudAccount(client);
  assert.equal(data.assets[0].content_base64, 'AP+J');
});
test('account deletion empties all pages through Storage before removing identity', async () => {
  let pending = 205, removed = 0, deleted = false;
  const client = {
    rpc: async name => {
      if (name === 'fable_prepare_account_deletion') return { data: Array.from({ length: Math.min(pending,200) }, (_,i) => ({ id: i, object_name: 'file-' + i })) };
      assert.equal(name, 'fable_delete_account'); assert.equal(pending,0); assert.equal(removed,205); deleted = true; return {};
    },
    storage: { from: () => ({ remove: async () => { removed++; return {}; } }) },
    schema: () => ({ rpc: async () => { pending--; return {}; } })
  };
  await deleteCloudAccount(client);
  assert.equal(deleted,true);
});
test('a Storage error aborts identity deletion so cleanup remains retryable', async () => {
  const client = { rpc: async name => { assert.equal(name,'fable_prepare_account_deletion'); return { data:[{id:1,object_name:'file'}] }; }, storage:{from:()=>({remove:async()=>({error:Error('offline')})})} };
  await assert.rejects(deleteCloudAccount(client), /offline/);
});
