export const SESSION_STORAGE_KEY = "fable-session";

export function normalizeSessionUrl(value) {
  if (typeof value !== "string" || !value.trim() || value.length > 4096) {
    throw new Error("Inserisci un link valido alla sessione.");
  }
  const input = value.trim();
  const url = new URL(
    /^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`,
  );
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error(
      "Usa un link HTTP o HTTPS senza credenziali nell’indirizzo.",
    );
  }
  return url.href;
}

export function readSession(storage) {
  try {
    const data = JSON.parse(storage.getItem(SESSION_STORAGE_KEY));
    if (!data) return null;
    return {
      name:
        typeof data.name === "string"
          ? data.name.slice(0, 80)
          : "La mia sessione",
      url: normalizeSessionUrl(data.url),
    };
  } catch {
    return null;
  }
}

export function isRoll20Url(value) {
  try {
    const { hostname } = new URL(normalizeSessionUrl(value));
    return hostname === "roll20.net" || hostname.endsWith(".roll20.net");
  } catch {
    return false;
  }
}
