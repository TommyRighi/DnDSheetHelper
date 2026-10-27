import english from './locales/en.json' with { type: 'json' };

// Translate presentation text only. Stored keys and user content retain their original values.
export function translate(language, text, ...values) {
  if (typeof text !== 'string') return text;
  const message = language === 'en' ? (Object.hasOwn(english, text) ? english[text] : text) : text;
  return message.replace(/\{(\d+)\}/g, (placeholder, index) => index < values.length ? String(values[index]) : placeholder);
}
