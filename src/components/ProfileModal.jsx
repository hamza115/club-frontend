import { useState } from 'react';
import api from '../lib/api';
import {
  User,
  BadgeCheck,
  Lock,
  KeyRound,
  Phone,
  Mail,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import ModalShell from './ModalShell';

function ProfileField({ label, icon: IconComp, value, onChange, placeholder, type = 'text', disabled }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-caption text-[11px] text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
        <IconComp size={14} strokeWidth={1.8} />
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-xl bg-surface border border-outline-variant/30 text-body font-body text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

export default function ProfileModal({ onClose }) {
  const { user, logout, refreshUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  function handleSaveProfile() {
    setSaving(true);
    setMessage(null);
    api.put('/auth/profile', { name: form.name, phone: form.phone })
      .then(() => {
        refreshUser();
        setMessage({ type: 'success', text: 'Profile updated' });
      })
      .catch((err) => setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' }))
      .finally(() => setSaving(false));
  }

  function handleChangePassword() {
    setMessage(null);
    if (!passwords.currentPassword || !passwords.newPassword) {
      setMessage({ type: 'error', text: 'Please fill all password fields' });
      return;
    }
    if (passwords.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setSaving(true);
    api.put('/auth/change-password', {
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword,
    })
      .then(() => {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      })
      .catch((err) => setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' }))
      .finally(() => setSaving(false));
  }

  const roleBadge = {
    super_admin: { label: 'Super Admin', tone: 'bg-primary-tint text-primary' },
    manager: { label: 'Manager', tone: 'bg-data-tint text-data' },
    cashier: { label: 'Cashier', tone: 'bg-good-tint text-good' },
  }[user?.role] || { label: user?.role, tone: 'bg-surface-container-high text-on-surface-variant' };

  return (
    <ModalShell title="My Profile" icon={User} onClose={onClose} maxWidth="max-w-md">
      {/* Profile Hero */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-16 w-16 rounded-2xl bg-primary-tint text-primary flex items-center justify-center shrink-0">
          <User size={32} strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <h3 className="font-title text-title text-on-surface">{user?.name}</h3>
          <p className="font-caption text-caption text-on-surface-variant mt-0.5">{user?.email}</p>
          <span className={`inline-block mt-1.5 rounded-full px-2.5 py-0.5 font-caption text-xs font-bold ${roleBadge.tone}`}>
            {roleBadge.label}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/20 mb-5">
        {[
          { key: 'profile', label: 'Profile', Icon: BadgeCheck },
          { key: 'password', label: 'Password', Icon: Lock },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => { setTab(t.key); setMessage(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 font-item-title text-item-title border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <t.Icon size={18} strokeWidth={1.8} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 rounded-xl p-3 flex items-center gap-2 font-body text-body ${
          message.type === 'success' ? 'bg-good-tint/30 text-good' : 'bg-alert-tint/30 text-alert'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} strokeWidth={1.8} /> : <AlertCircle size={18} strokeWidth={1.8} />}
          {message.text}
        </div>
      )}

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="space-y-4">
          <ProfileField label="Full Name" icon={User} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Your name" />
          <ProfileField label="Email" icon={Mail} value={form.email} placeholder="Email" disabled />
          <ProfileField label="Phone" icon={Phone} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+92 300 1234567" />
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full h-10 rounded-xl bg-primary text-on-primary font-item-title text-item-title hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={18} strokeWidth={1.8} className="animate-spin" /> : <Save size={18} strokeWidth={1.8} />}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      )}

      {/* Password Tab */}
      {tab === 'password' && (
        <div className="space-y-4">
          <ProfileField label="Current Password" icon={Lock} value={passwords.currentPassword} onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))} placeholder="Enter current password" type="password" />
          <ProfileField label="New Password" icon={KeyRound} value={passwords.newPassword} onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))} placeholder="Min 6 characters" type="password" />
          <ProfileField label="Confirm New Password" icon={KeyRound} value={passwords.confirmPassword} onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))} placeholder="Re-enter new password" type="password" />
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={saving}
            className="w-full h-10 rounded-xl bg-primary text-on-primary font-item-title text-item-title hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={18} strokeWidth={1.8} className="animate-spin" /> : <Lock size={18} strokeWidth={1.8} />}
            {saving ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      )}

      {/* Logout */}
      <div className="mt-6 pt-4 border-t border-outline-variant/10">
        <button
          type="button"
          onClick={() => { logout(); onClose(); }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-alert-tint/20 text-alert font-item-title text-item-title hover:bg-alert-tint/30 transition-colors"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Sign Out
        </button>
      </div>
    </ModalShell>
  );
}
