// Account lifecycle spans Postgres and private Storage. Never delete Storage metadata directly.
export async function exportCloudAccount(client) {
  const { data, error } = await client.rpc('fable_export_account');
  if (error) throw error;
  for (const asset of data.assets || []) {
    const response = await client.storage.from('latex-assets').download(asset.object_name);
    if (response.error) throw response.error;
    const bytes = new Uint8Array(await response.data.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    asset.content_base64 = btoa(binary);
  }
  return data;
}
export async function deleteCloudAccount(client) {
  // RPC results are capped by PostgREST. Repeat after removing each page.
  for (;;) {
    const { data, error } = await client.rpc('fable_prepare_account_deletion');
    if (error) throw error;
    if (!data.length) break;
    for (const asset of data) {
      const removed = await client.storage.from('latex-assets').remove([asset.object_name]);
      if (removed.error) throw removed.error;
      const released = await client.schema('latex').rpc('release_asset', { p_asset: asset.id });
      if (released.error) throw released.error;
    }
  }
  const { error } = await client.rpc('fable_delete_account');
  if (error) throw error;
}
