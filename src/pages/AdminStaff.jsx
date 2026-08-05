import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import AppLayout from '../components/AppLayout';
import EntityCard from '../components/EntityCard';
import FormInput from '../components/FormInput';
import Toast from '../components/Toast';
import {
  BadgeCheck, ShoppingCart, CheckCircle2, XCircle, ChevronUp, ChevronDown,
  Check, X, UserPlus, Loader2, Users, User, Mail, Phone, Lock, KeyRound,
  Pencil, BadgeX,
} from 'lucide-react';

const ROLES = [
  { value: 'manager', label: 'Manager', Icon: BadgeCheck },
  { value: 'cashier', label: 'Cashier', Icon: ShoppingCart },
];

const STATUSES = [
  { value: true, label: 'Active', Icon: CheckCircle2 },
  { value: false, label: 'Inactive', Icon: XCircle },
];

const ROLE_BADGE = {
  manager: 'bg-data-tint text-data',
  cashier: 'bg-warn-tint text-warn',
  super_admin: 'bg-primary-container text-on-primary-container',
};

function IconDropdown({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value) || options[0];
  const SelectedIcon = selected.Icon;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 pl-sm pr-3 py-sm bg-surface-container-lowest border border-outline-variant rounded-input text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all"
      >
        <div className="flex items-center gap-2">
          <SelectedIcon size={18} strokeWidth={1.8} className="text-outline" />
          <span className="font-body text-body">{selected.label}</span>
        </div>
        {open ? <ChevronUp size={18} strokeWidth={1.8} className="text-outline" /> : <ChevronDown size={18} strokeWidth={1.8} className="text-outline" />}
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-paper rounded-lg border border-outline-variant/30 shadow-lg z-10 overflow-hidden">
          {options.map((o) => {
            const OIcon = o.Icon;
            return (
              <button
                key={String(o.value)}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-container-high transition-colors ${
                  value === o.value ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface'
                }`}
              >
                <OIcon size={18} strokeWidth={1.8} />
                <span className="font-body text-body">{o.label}</span>
                {value === o.value && (
                  <Check size={18} strokeWidth={1.8} className="ml-auto" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddStaffModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'cashier' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/create-staff', form);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create staff');
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (error) setError('');
  };

  return (
    <div className="fixed inset-0 bg-on-background/40 backdrop-blur-sm z-[100] flex items-center justify-center px-4 py-4">
      <div className="bg-paper rounded-card p-lg md:p-xl shadow-xl border border-outline-variant/20 w-full max-w-[440px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-lg">
          <h2 className="font-title text-title text-on-surface">Add Staff Member</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>
        <Toast message={error} type="error" onClose={() => setError('')} />
        <form onSubmit={handleSubmit} className="space-y-lg">
          <FormInput label="Full Name" icon={User} type="text" placeholder="John Doe" value={form.name} onChange={update('name')} />
          <FormInput label="Email" icon={Mail} type="email" placeholder="staff@cuemaster.com" value={form.email} onChange={update('email')} />
          <FormInput label="Phone" icon={Phone} type="tel" placeholder="0300-0000000" value={form.phone} onChange={update('phone')} />
          <FormInput label="Password" icon={Lock} type="password" placeholder="Min. 6 characters" value={form.password} onChange={update('password')} />
          <div>
            <label className="block font-item-title text-item-title text-on-surface-variant mb-xs">Role</label>
            <IconDropdown
              options={ROLES}
              value={form.role}
              onChange={(role) => setForm({ ...form, role })}
            />
          </div>
          <div className="flex gap-sm">
            <button type="button" onClick={onClose} className="flex-1 py-sm px-lg rounded-full bg-surface text-on-surface hover:bg-surface-container-high transition-colors font-item-title text-item-title">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-sm px-lg rounded-full bg-primary text-on-primary hover:bg-surface-tint transition-colors font-item-title text-item-title disabled:opacity-60">
              {loading ? 'Creating...' : 'Create Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditStaffModal({ staff, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: staff.name || '',
    email: staff.email || '',
    phone: staff.phone || '',
    role: staff.role || 'cashier',
    isActive: staff.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.put(`/users/${staff._id}`, form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update staff');
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (error) setError('');
  };

  return (
    <div className="fixed inset-0 bg-on-background/40 backdrop-blur-sm z-[100] flex items-center justify-center px-4 py-4">
      <div className="bg-paper rounded-card p-lg md:p-xl shadow-xl border border-outline-variant/20 w-full max-w-[440px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-lg">
          <h2 className="font-title text-title text-on-surface">Edit Staff</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>
        <Toast message={error} type="error" onClose={() => setError('')} />
        <form onSubmit={handleSubmit} className="space-y-lg">
          <FormInput label="Full Name" icon={User} type="text" value={form.name} onChange={update('name')} />
          <FormInput label="Email" icon={Mail} type="email" value={form.email} onChange={update('email')} />
          <FormInput label="Phone" icon={Phone} type="tel" value={form.phone} onChange={update('phone')} />
          <div>
            <label className="block font-item-title text-item-title text-on-surface-variant mb-xs">Role</label>
            <IconDropdown
              options={ROLES}
              value={form.role}
              onChange={(role) => setForm({ ...form, role })}
            />
          </div>
          <div>
            <label className="block font-item-title text-item-title text-on-surface-variant mb-xs">Status</label>
            <IconDropdown
              options={STATUSES}
              value={form.isActive}
              onChange={(isActive) => setForm({ ...form, isActive })}
            />
          </div>
          <div className="flex gap-sm">
            <button type="button" onClick={onClose} className="flex-1 py-sm px-lg rounded-full bg-surface text-on-surface hover:bg-surface-container-high transition-colors font-item-title text-item-title">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-sm px-lg rounded-full bg-primary text-on-primary hover:bg-surface-tint transition-colors font-item-title text-item-title disabled:opacity-60">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ staff, onClose, onReset }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post(`/users/${staff._id}/reset-password`, { newPassword: password });
      onReset();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-on-background/40 backdrop-blur-sm z-[100] flex items-center justify-center px-4 py-4">
      <div className="bg-paper rounded-card p-lg md:p-xl shadow-xl border border-outline-variant/20 w-full max-w-[400px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-lg">
          <h2 className="font-title text-title text-on-surface">Reset Password</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>
        <Toast message={error} type="error" onClose={() => setError('')} />
        <p className="font-body text-body text-on-surface-variant mb-lg">
          Set a new password for <span className="text-on-surface font-semibold">{staff.name}</span>
        </p>
        <form onSubmit={handleSubmit}>
          <FormInput label="New Password" icon={Lock} type="password" placeholder="Min. 6 characters" value={password} onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }} />
          <div className="flex gap-sm mt-lg">
            <button type="button" onClick={onClose} className="flex-1 py-sm px-lg rounded-full bg-surface text-on-surface hover:bg-surface-container-high transition-colors font-item-title text-item-title">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-sm px-lg rounded-full bg-primary text-on-primary hover:bg-surface-tint transition-colors font-item-title text-item-title disabled:opacity-60">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [resetStaff, setResetStaff] = useState(null);
  const [toast, setToast] = useState('');

  const fetchStaff = async () => {
    try {
      const res = await api.get('/users');
      const users = res.data.data.users || [];
      setStaff(users.filter((u) => u.role !== 'super_admin'));
    } catch {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleCreated = () => {
    setShowAdd(false);
    showToast('Staff member created');
    fetchStaff();
  };

  const handleSaved = () => {
    setEditStaff(null);
    showToast('Staff updated');
    fetchStaff();
  };

  const handleReset = () => {
    setResetStaff(null);
    showToast('Password reset successfully');
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await api.put(`/users/${id}`, { isActive: !isActive });
      fetchStaff();
    } catch {}
  };

  return (
    <AppLayout>
      {showAdd && <AddStaffModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />}
      {editStaff && <EditStaffModal staff={editStaff} onClose={() => setEditStaff(null)} onSaved={handleSaved} />}
      {resetStaff && <ResetPasswordModal staff={resetStaff} onClose={() => setResetStaff(null)} onReset={handleReset} />}

      <Toast message={toast} type="success" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-3 md:gap-4">
        <div>
          <h2 className="font-headline text-headline-mobile md:text-headline text-on-background">Staff</h2>
          <p className="font-body text-body text-on-surface-variant mt-1">Manage your team members and roles.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-primary text-on-primary rounded-full px-5 md:px-6 py-2.5 font-item-title text-item-title flex items-center gap-2 hover:bg-surface-tint transition-colors self-start"
        >
          <UserPlus size={18} strokeWidth={1.8} /> Add Staff
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={36} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
        </div>
      ) : staff.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users size={48} strokeWidth={1.5} className="text-on-surface-variant mb-4" />
          <p className="font-body text-body text-on-surface-variant mb-2">No staff members yet</p>
          <p className="font-caption text-caption text-on-surface-variant">Add your first team member to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {staff.map((s) => {
            const roleBadge = ROLE_BADGE[s.role] || 'bg-surface-container text-on-surface-variant';
            const badges = [
              { label: s.role, className: roleBadge },
            ];
            if (!s.isActive) badges.push({ label: 'Inactive', className: 'bg-alert-tint text-alert' });

            return (
              <EntityCard
                key={s._id}
                icon={User}
                title={s.name}
                subtitle={s.email}
                badges={badges}
                details={[
                  { label: 'Phone', value: s.phone || '—' },
                  { label: 'Role', value: s.role === 'super_admin' ? 'Admin' : s.role.charAt(0).toUpperCase() + s.role.slice(1) },
                ]}
                actions={[
                  { label: s.isActive ? 'Active' : 'Inactive', icon: s.isActive ? CheckCircle2 : XCircle, onClick: () => handleToggleActive(s._id, s.isActive) },
                  { label: 'Edit', icon: Pencil, onClick: () => setEditStaff(s) },
                  { label: 'Password', icon: KeyRound, onClick: () => setResetStaff(s) },
                ]}
              />
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
