export function readLanguage(storage) {
  try {
    return (storage ?? globalThis.localStorage).getItem('fable-language') === 'en' ? 'en' : 'it';
  } catch {
    return 'it';
  }
}

export function saveLanguage(language, storage) {
  if (!['it', 'en'].includes(language)) throw new Error('Unsupported language');
  (storage ?? globalThis.localStorage).setItem('fable-language', language);
}
