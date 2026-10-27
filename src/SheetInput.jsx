import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { useTranslation } from './i18n.jsx';

// The separate print value keeps long text readable on paper, beyond the textarea viewport.
export default function SheetInput({ label, value = '', onChange, multiline = false, maxLength = 10000, required = false, type = 'text', min, max, className = '', placeholder = '' }) {
  const t = useTranslation();
  const [draft, setDraft] = useState(String(value));
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => { setDraft(String(value)); setInvalid(false); }, [value]);
  useLayoutEffect(() => {
    if (!multiline || !inputRef.current) return;
    const field = inputRef.current;
    const resize = () => {
      if (!field.getClientRects().length) return;
      field.style.height = 'auto';
      field.style.height = `${field.scrollHeight + 2}px`;
    };
    resize();
    // Sheet views are mounted while hidden; resize again when shown or reflowed on mobile.
    let previousWidth = -1;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === previousWidth) return;
      previousWidth = entry.contentRect.width;
      resize();
    });
    observer.observe(field);
    return () => observer.disconnect();
  }, [draft, multiline]);
  const Input = multiline ? 'textarea' : 'input';
  return <span className={`sheet-editable ${multiline ? 'sheet-editable-multiline' : ''} ${className}`}>
    <Input
      ref={inputRef}
      className="sheet-input"
      aria-label={label}
      aria-invalid={invalid || undefined}
      value={draft}
      placeholder={placeholder}
      maxLength={type === 'text' ? maxLength : undefined}
      required={required}
      {...(!multiline ? { type, min, max, step: type === 'number' ? 1 : undefined } : { rows: 2 })}
      onChange={event => {
        const next = event.target.value;
        setDraft(next);
        const valid = event.target.validity.valid && (!required || !!next.trim()) && (type !== 'number' || next !== '');
        setInvalid(!valid);
        if (valid) onChange(type === 'number' ? Number(next) : next);
      }}
      onBlur={event => setInvalid(!event.target.validity.valid || (required && !draft.trim()) || (type === 'number' && draft === ''))}
    />
    {invalid && <small className="sheet-input-error" role="alert">{t('Inserisci un valore valido.')}</small>}
    <span className="sheet-print-value">{String(value) || '\u00a0'}</span>
  </span>;
}
