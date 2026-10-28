// Keep pages below the shared API limit and use stable ordering at each call site.
export async function allCloudRows(queryPage, pageSize = 100) {
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await queryPage(offset, offset + pageSize - 1);
    if (error) throw error;
    if (!Array.isArray(data)) throw new Error('Risposta del servizio non valida.');
    rows.push(...data);
    if (data.length < pageSize) return rows;
  }
}
