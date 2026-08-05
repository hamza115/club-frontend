import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { setCurrencyFormatter } from '../lib/currency';

const SettingsContext = createContext(null);

const CURRENCY_MAP = {
  PKR: { code: 'PKR', locale: 'en-PK' },
  USD: { code: 'USD', locale: 'en-US' },
  GBP: { code: 'GBP', locale: 'en-GB' },
  EUR: { code: 'EUR', locale: 'de-DE' },
  AED: { code: 'AED', locale: 'ar-AE' },
  SAR: { code: 'SAR', locale: 'ar-SA' },
  INR: { code: 'INR', locale: 'en-IN' },
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return { clubName: '', currency: 'PKR', timezone: 'Asia/Karachi', language: 'en' };
  });

  const currencyInfo = CURRENCY_MAP[settings.currency] || CURRENCY_MAP.PKR;

  const formatCurrency = useCallback((value) => {
    const num = Number(value || 0);
    try {
      return num.toLocaleString(currencyInfo.locale, {
        style: 'currency',
        currency: currencyInfo.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    } catch {
      return `${currencyInfo.code} ${num.toLocaleString()}`;
    }
  }, [currencyInfo]);

  useEffect(() => {
    setCurrencyFormatter(formatCurrency);
  }, [formatCurrency]);

  const currencyCode = currencyInfo.code;

  useEffect(() => {
    api.get('/settings')
      .then((res) => {
        const items = res.data.data?.settings || [];
        const mapped = {};
        const keyMap = { businessPhone: 'phone', businessEmail: 'email' };
        items.forEach((s) => {
          if (s.key === 'clubName' || s.key === 'currency' || s.key === 'timezone' || s.key === 'language' ||
              s.key === 'address' || s.key === 'businessPhone' || s.key === 'businessEmail' || s.key === 'website' || s.key === 'registrationNo') {
            mapped[keyMap[s.key] || s.key] = s.value;
          }
        });
        if (Object.keys(mapped).length > 0) {
          setSettings((prev) => {
            const next = { ...prev, ...mapped };
            localStorage.setItem('appSettings', JSON.stringify(next));
            return next;
          });
        }
      })
      .catch(() => {});
  }, []);

  function updateSettings(updates) {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('appSettings', JSON.stringify(next));
      return next;
    });
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, formatCurrency, currencyCode }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
