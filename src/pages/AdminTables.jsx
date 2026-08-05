import { useState, useEffect } from 'react';
import api from '../lib/api';
import AppLayout from '../components/AppLayout';
import ConfirmModal from '../components/ConfirmModal';
import FormInput from '../components/FormInput';
import Toast from '../components/Toast';
import { formatCurrency } from '../lib/currency';
import { useSettings } from '../context/SettingsContext';
import { Plus, X, CreditCard, Tag, Pencil, Trash2, CircleDot, Loader2, AlertTriangle, Hash, Target, StickyNote, CheckCircle2 } from 'lucide-react';

const STATUS_STYLES = {
  available: { badge: 'bg-good-tint text-good', dot: 'bg-good' },
  occupied: { badge: 'bg-data-tint text-data', dot: 'bg-data' },
  reserved: { badge: 'bg-warn-tint text-warn', dot: 'bg-warn' },
  maintenance: { badge: 'bg-surface-container-high text-on-surface-variant', dot: 'bg-on-surface-variant' },
};

function AddTableModal({ onClose, onCreated }) {
  const { currencyCode } = useSettings();
  const [form, setForm] = useState({ tableNumber: '', hourlyRate: '500', frameRate: '200', perMinuteRate: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/tables', {
        tableNumber: Number(form.tableNumber),
        hourlyRate: Number(form.hourlyRate),
        frameRate: Number(form.frameRate),
        perMinuteRate: Number(form.perMinuteRate) || 0,
        notes: form.notes,
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create table');
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
          <h2 className="font-title text-title text-on-surface">Add New Table</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>
        <Toast message={error} type="error" onClose={() => setError('')} />
        <form onSubmit={handleSubmit} className="space-y-lg">
          <FormInput label="Table Number" icon={Hash} type="number" placeholder="1" value={form.tableNumber} onChange={update('tableNumber')} />
          <FormInput label={`Hourly Rate (${currencyCode})`} icon={CreditCard} type="number" placeholder="500" value={form.hourlyRate} onChange={update('hourlyRate')} />
          <FormInput label={`Frame Rate (${currencyCode})`} icon={Target} type="number" placeholder="200" value={form.frameRate} onChange={update('frameRate')} />
          <FormInput label={`Per Minute Rate (${currencyCode})`} icon={CreditCard} type="number" placeholder="8" value={form.perMinuteRate} onChange={update('perMinuteRate')} />
          <FormInput label="Notes (optional)" icon={StickyNote} type="text" placeholder="VIP room, standard, etc." value={form.notes} onChange={update('notes')} />
          <div className="flex gap-sm">
            <button type="button" onClick={onClose} className="flex-1 py-sm px-lg rounded-full bg-surface text-on-surface hover:bg-surface-container-high transition-colors font-item-title text-item-title">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-sm px-lg rounded-full bg-primary text-on-primary hover:bg-surface-tint transition-colors font-item-title text-item-title disabled:opacity-60">
              {loading ? 'Adding...' : 'Add Table'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditTableModal({ table, onClose, onSaved }) {
  const { currencyCode } = useSettings();
  const [form, setForm] = useState({
    tableNumber: String(table.tableNumber),
    hourlyRate: String(table.hourlyRate),
    frameRate: String(table.frameRate || ''),
    perMinuteRate: String(table.perMinuteRate || ''),
    notes: table.notes || '',
    status: table.status,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.put(`/tables/${table._id}`, {
        tableNumber: Number(form.tableNumber),
        hourlyRate: Number(form.hourlyRate),
        frameRate: Number(form.frameRate),
        perMinuteRate: Number(form.perMinuteRate) || 0,
        notes: form.notes,
        status: form.status,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update table');
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (error) setError('');
  };

  const STATUS_OPTIONS = [
    { value: 'available', label: 'Available' },
    { value: 'occupied', label: 'Occupied' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'maintenance', label: 'Maintenance' },
  ];

  return (
    <div className="fixed inset-0 bg-on-background/40 backdrop-blur-sm z-[100] flex items-center justify-center px-4 py-4">
      <div className="bg-paper rounded-card p-lg md:p-xl shadow-xl border border-outline-variant/20 w-full max-w-[440px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-lg">
          <h2 className="font-title text-title text-on-surface">Edit Table {String(table.tableNumber).padStart(2, '0')}</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>
        <Toast message={error} type="error" onClose={() => setError('')} />
        <form onSubmit={handleSubmit} className="space-y-lg">
          <FormInput label="Table Number" icon={Hash} type="number" value={form.tableNumber} onChange={update('tableNumber')} />
          <FormInput label={`Hourly Rate (${currencyCode})`} icon={CreditCard} type="number" value={form.hourlyRate} onChange={update('hourlyRate')} />
          <FormInput label={`Frame Rate (${currencyCode})`} icon={Target} type="number" value={form.frameRate} onChange={update('frameRate')} />
          <FormInput label={`Per Minute Rate (${currencyCode})`} icon={CreditCard} type="number" value={form.perMinuteRate} onChange={update('perMinuteRate')} />
          <FormInput label="Notes" icon={StickyNote} type="text" value={form.notes} onChange={update('notes')} />
          <div>
            <label className="block font-item-title text-item-title text-on-surface-variant mb-xs">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, status: opt.value })}
                  className={`py-sm px-lg rounded-full font-item-title text-item-title transition-colors ${
                    form.status === opt.value ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
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

function DeleteConfirmModal({ table, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await api.delete(`/tables/${table._id}`);
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete table');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast message={error} type="error" onClose={() => setError('')} />
      <ConfirmModal
        title="Delete Table"
        description={`Are you sure you want to delete Table ${String(table.tableNumber).padStart(2, '0')}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmTone="danger"
        icon={AlertTriangle}
        loading={loading}
        onClose={onClose}
        onConfirm={handleDelete}
      />
    </>
  );
}

export default function AdminTables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editTable, setEditTable] = useState(null);
  const [deleteTable, setDeleteTable] = useState(null);
  const [toast, setToast] = useState('');

  const fetchTables = async () => {
    try {
      const res = await api.get('/tables');
      setTables(res.data.data.tables || []);
    } catch {
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTables(); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleCreated = () => {
    setShowAdd(false);
    showToast('Table created successfully');
    fetchTables();
  };

  const handleSaved = () => {
    setEditTable(null);
    showToast('Table updated');
    fetchTables();
  };

  const handleDeleted = () => {
    setDeleteTable(null);
    showToast('Table deleted');
    fetchTables();
  };

  return (
    <AppLayout>
      {showAdd && <AddTableModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />}
      {editTable && <EditTableModal table={editTable} onClose={() => setEditTable(null)} onSaved={handleSaved} />}
      {deleteTable && <DeleteConfirmModal table={deleteTable} onClose={() => setDeleteTable(null)} onDeleted={handleDeleted} />}

      <Toast message={toast} type="success" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-3 md:gap-4">
        <div>
          <h2 className="font-headline text-headline-mobile md:text-headline text-on-background">Tables</h2>
          <p className="font-body text-body text-on-surface-variant mt-1">Add, edit, and manage your club tables.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-primary text-on-primary rounded-full px-5 md:px-6 py-2.5 font-item-title text-item-title flex items-center gap-2 hover:bg-surface-tint transition-colors self-start"
        >
          <Plus size={18} strokeWidth={1.8} /> Add Table
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} strokeWidth={1.5} className="animate-spin text-on-surface-variant" />
        </div>
      ) : tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CircleDot size={32} strokeWidth={1.5} className="text-on-surface-variant mb-4" />
          <p className="font-body text-body text-on-surface-variant mb-2">No tables yet</p>
          <p className="font-caption text-caption text-on-surface-variant">Add your first table to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {tables.map((t) => {
            const style = STATUS_STYLES[t.status] || STATUS_STYLES.available;
            return (
              <div key={t._id} className="bg-paper rounded-[18px] p-4 md:p-6 border border-outline-variant/20 flex flex-col hover:shadow-lg transition-shadow duration-300">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                      <CircleDot size={24} strokeWidth={1.8} />
                    </div>
                    <div>
                      <h3 className="font-title text-title text-on-surface">Table {String(t.tableNumber).padStart(2, '0')}</h3>
                      <span className="font-caption text-caption text-on-surface-variant">
                        {formatCurrency(t.hourlyRate)}/hr{t.frameRate ? ` • ${formatCurrency(t.frameRate)}/frame` : ''}{t.perMinuteRate ? ` • ${formatCurrency(t.perMinuteRate)}/min` : ''}
                      </span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full ${style.badge} font-item-title text-item-title text-xs capitalize flex items-center gap-1.5`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {t.status}
                  </span>
                </div>

                {/* Details */}
                {t.notes && (
                  <p className="font-caption text-caption text-on-surface-variant mb-4 bg-surface rounded-lg px-3 py-2">{t.notes}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-4 border-t border-outline-variant/10">
                  <button
                    onClick={() => setEditTable(t)}
                    className="flex-1 px-4 py-2.5 rounded-full bg-surface text-on-surface hover:bg-surface-container-high transition-colors font-item-title text-item-title flex justify-center items-center gap-2"
                  >
                    <Pencil size={18} strokeWidth={1.8} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteTable(t)}
                    className="px-4 py-2.5 rounded-full bg-alert-tint text-alert hover:opacity-80 transition-colors font-item-title text-item-title flex justify-center items-center gap-2"
                  >
                    <Trash2 size={18} strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
