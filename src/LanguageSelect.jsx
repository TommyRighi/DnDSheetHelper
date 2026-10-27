import React from 'react';

export default function LanguageSelect({ language, onChange }) {
  return (
    <label className="language-select">
      <span>{language === 'en' ? 'Language' : 'Lingua'}</span>
      <select value={language} onChange={event => onChange(event.target.value)}>
        <option value="it" lang="it">Italiano</option>
        <option value="en" lang="en">English</option>
      </select>
    </label>
  );
}
