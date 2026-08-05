import { useState, useEffect } from 'react';
import api from '../lib/api';
import AppLayout from '../components/AppLayout';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import {
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  Building2,
  Moon,
  Sun,
} from 'lucide-react';

function SettingsSection({ title, icon: IconComponent, children }) {
  return (
    <div className="rounded-[18px] bg-paper border border-outline-variant/20 p-5 md:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-9 w-9 rounded-xl bg-primary-tint text-primary flex items-center justify-center shrink-0">
          <IconComponent size={20} strokeWidth={1.8} />
        </div>
        <h3 className="font-item-title text-item-title text-on-surface">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function SettingsField({ label, description, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-outline-variant/10 last:border-0 last:pb-0 first:pt-0">
      <div className="min-w-0">
        <p className="font-item-title text-item-title text-on-surface">{label}</p>
        {description && <p className="font-caption text-caption text-on-surface-variant mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0 sm:max-w-[280px] w-full sm:w-auto">{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', disabled }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-4 py-2.5 rounded-xl bg-surface border border-outline-variant/30 text-body font-body text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
}

function SelectInput({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2.5 rounded-xl bg-surface border border-outline-variant/30 text-body font-body text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors appearance-none cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function Toggle({ enabled, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/30 ${
        enabled ? 'bg-primary' : 'bg-surface-container-highest'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-paper shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const { theme, setThemeMode } = useTheme();
  const { settings, updateSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [general, setGeneral] = useState({
    clubName: settings.clubName || '',
    currency: settings.currency || 'PKR',
    timezone: settings.timezone || 'Asia/Karachi',
    language: settings.language || 'en',
  });
  const [business, setBusiness] = useState({
    address: settings.address || '',
    phone: settings.phone || '',
    email: settings.email || '',
    website: settings.website || '',
    registrationNo: settings.registrationNo || '',
  });

  useEffect(() => {
    api.get('/settings')
      .then((res) => {
        const items = res.data.data?.settings || [];
        const generalUpdates = {};
        const businessUpdates = {};
        items.forEach((s) => {
          if (s.key === 'clubName' || s.key === 'currency' || s.key === 'timezone' || s.key === 'language') {
            generalUpdates[s.key] = s.value;
          } else if (s.key === 'address' || s.key === 'businessPhone' || s.key === 'businessEmail' || s.key === 'website' || s.key === 'registrationNo') {
            const map = { businessPhone: 'phone', businessEmail: 'email' };
            businessUpdates[map[s.key] || s.key] = s.value;
          } else if (s.key === 'theme') {
            setThemeMode(s.value);
          }
        });
        if (Object.keys(generalUpdates).length > 0) setGeneral((prev) => ({ ...prev, ...generalUpdates }));
        if (Object.keys(businessUpdates).length > 0) setBusiness((prev) => ({ ...prev, ...businessUpdates }));
      })
      .catch(() => {});
  }, [setThemeMode]);

  function handleSave() {
    setSaving(true);
    setMessage(null);

    const settings = [
      { key: 'clubName', value: general.clubName, group: 'general' },
      { key: 'currency', value: general.currency, group: 'general' },
      { key: 'timezone', value: general.timezone, group: 'general' },
      { key: 'language', value: general.language, group: 'general' },
      { key: 'address', value: business.address, group: 'general' },
      { key: 'businessPhone', value: business.phone, group: 'general' },
      { key: 'businessEmail', value: business.email, group: 'general' },
      { key: 'website', value: business.website, group: 'general' },
      { key: 'registrationNo', value: business.registrationNo, group: 'general' },
      { key: 'theme', value: theme, group: 'theme' },
    ];

    api.put('/settings', { settings })
      .then(() => {
        updateSettings({
          clubName: general.clubName,
          currency: general.currency,
          timezone: general.timezone,
          language: general.language,
          address: business.address,
          phone: business.phone,
          email: business.email,
          website: business.website,
          registrationNo: business.registrationNo,
        });
        setMessage({ type: 'success', text: 'Settings saved successfully' });
      })
      .catch((err) => setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save settings' }))
      .finally(() => setSaving(false));
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-title text-title text-on-surface">Settings</h1>
            <p className="font-body text-body text-on-surface-variant mt-1">Manage your club configuration</p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-5 rounded-xl bg-primary text-on-primary font-item-title text-item-title hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <Loader2 size={18} strokeWidth={1.8} className="animate-spin" />
            ) : (
              <Save size={18} strokeWidth={1.8} />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 rounded-xl p-3 flex items-center gap-2 font-body text-body ${
            message.type === 'success' ? 'bg-good-tint/30 text-good' : 'bg-alert-tint/30 text-alert'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 size={18} strokeWidth={1.8} />
            ) : (
              <AlertCircle size={18} strokeWidth={1.8} />
            )}
            {message.text}
          </div>
        )}

        <div className="flex flex-col gap-5">
          {/* General */}
          <SettingsSection title="General" icon={SlidersHorizontal}>
            <SettingsField label="Club Name" description="Display name for your club">
              <TextInput value={general.clubName} onChange={(v) => setGeneral((p) => ({ ...p, clubName: v }))} placeholder="My Snooker Club" />
            </SettingsField>
            <SettingsField label="Currency" description="Currency used for billing">
              <SelectInput
                value={general.currency}
                onChange={(v) => setGeneral((p) => ({ ...p, currency: v }))}
                options={[
                  { value: 'PKR', label: 'PKR - Pakistani Rupee' },
                  { value: 'USD', label: 'USD - US Dollar' },
                  { value: 'GBP', label: 'GBP - British Pound' },
                  { value: 'EUR', label: 'EUR - Euro' },
                  { value: 'AED', label: 'AED - UAE Dirham' },
                  { value: 'SAR', label: 'SAR - Saudi Riyal' },
                  { value: 'INR', label: 'INR - Indian Rupee' },
                ]}
              />
            </SettingsField>
            <SettingsField label="Timezone" description="Timezone for scheduling and reports">
              <SelectInput
                value={general.timezone}
                onChange={(v) => setGeneral((p) => ({ ...p, timezone: v }))}
                options={[
                  { value: 'Asia/Karachi', label: 'Asia/Karachi (UTC+5)' },
                  { value: 'Asia/Dubai', label: 'Asia/Dubai (UTC+4)' },
                  { value: 'Asia/Riyadh', label: 'Asia/Riyadh (UTC+3)' },
                  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (UTC+5:30)' },
                  { value: 'Europe/London', label: 'Europe/London (UTC+0/1)' },
                  { value: 'America/New_York', label: 'America/New_York (UTC-5/4)' },
                ]}
              />
            </SettingsField>
            <SettingsField label="Language" description="Application display language">
              <SelectInput
                value={general.language}
                onChange={(v) => setGeneral((p) => ({ ...p, language: v }))}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'ur', label: 'Urdu' },
                  { value: 'ar', label: 'Arabic' },
                  { value: 'hi', label: 'Hindi' },
                ]}
              />
            </SettingsField>
          </SettingsSection>

          {/* Business Information */}
          <SettingsSection title="Business Information" icon={Building2}>
            <SettingsField label="Address" description="Club physical address">
              <TextInput value={business.address} onChange={(v) => setBusiness((p) => ({ ...p, address: v }))} placeholder="123 Main Street, City" />
            </SettingsField>
            <SettingsField label="Phone" description="Business contact number">
              <TextInput value={business.phone} onChange={(v) => setBusiness((p) => ({ ...p, phone: v }))} placeholder="+92 300 1234567" />
            </SettingsField>
            <SettingsField label="Email" description="Business email address">
              <TextInput value={business.email} onChange={(v) => setBusiness((p) => ({ ...p, email: v }))} placeholder="info@club.com" type="email" />
            </SettingsField>
            <SettingsField label="Website" description="Business website URL">
              <TextInput value={business.website} onChange={(v) => setBusiness((p) => ({ ...p, website: v }))} placeholder="https://www.club.com" />
            </SettingsField>
            <SettingsField label="Registration No." description="Business registration or tax ID">
              <TextInput value={business.registrationNo} onChange={(v) => setBusiness((p) => ({ ...p, registrationNo: v }))} placeholder="REG-000123" />
            </SettingsField>
          </SettingsSection>

          {/* Theme */}
          <SettingsSection title="Theme" icon={Moon}>
            <SettingsField label="Dark Mode" description="Switch between light and dark appearance">
              <div className="flex items-center gap-3">
                <Sun size={18} strokeWidth={1.8} className="text-on-surface-variant" />
                <Toggle
                  enabled={theme === 'dark'}
                  onChange={(dark) => setThemeMode(dark ? 'dark' : 'light')}
                />
                <Moon size={18} strokeWidth={1.8} className="text-on-surface-variant" />
              </div>
            </SettingsField>
          </SettingsSection>
        </div>
      </div>
    </AppLayout>
  );
}
