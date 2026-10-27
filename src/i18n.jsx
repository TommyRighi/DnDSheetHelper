import React, { createContext, useContext, useEffect, useState } from 'react';
import { readLanguage } from './language.js';
import { translate } from './translations.js';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(readLanguage);
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = language === 'en'
      ? 'Fable · Your adventure companion'
      : "Fable · Il tuo compagno d'avventura";
  }, [language]);
  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('LanguageProvider is required');
  return context;
}

export function useTranslation() {
  const { language } = useLanguage();
  const t = (text, ...values) => translate(language, text, ...values);
  t.locale = language === 'en' ? 'en-GB' : 'it-IT';
  return t;
}
