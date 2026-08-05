import { useState, useEffect } from 'react';
import { PlusCircle, Pencil, Type, CreditCard, Calendar, Store, StickyNote, Repeat } from 'lucide-react';
import api from '../lib/api';
import ModalShell from './ModalShell';
import FormInput from './FormInput';

const CATEGORIES = [
  { value: 'rent', label: 'Rent' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'water', label: 'Water' },
  { value: 'internet', label: 'Internet' },
  { value: 'salaries', label: 'Salaries' },
  { value: 'purchases', label: 'Purchases' },
  { value: 'repairs', label: 'Repairs' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'taxes', label: 'Taxes' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mobile_wallet', label: 'Mobile Wallet' },
];

const RECURRENCE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const EMPTY_FORM = {
  title: '',
  category: '',
  amount: '',
  paymentMethod: '',
  date: new Date().toISOString().slice(0, 10),
  description: '',
  vendor: '',
  notes: '',
  isRecurring: false,
  recurrenceFrequency: '',
};

export default function ExpenseModal({ expense, onClose, onSaved }) {
  const isEdit = Boolean(expense);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (expense) {
      setForm({
        title: expense.title || '',
        category: expense.category || '',
        amount: String(expense.amount ?? ''),
        paymentMethod: expense.paymentMethod || '',
        date: expense.date ? new Date(expense.date).toISOString().slice(0, 10) : '',
        description: expense.description || '',
        vendor: expense.vendor || '',
        notes: expense.notes || '',
        isRecurring: expense.isRecurring || false,
        recurrenceFrequency: expense.recurrenceFrequency || '',
      });
    }
  }, [expense]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.category) e.category = 'Category is required';
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Valid amount is required';
    if (!form.paymentMethod) e.paymentMethod = 'Payment method is required';
    if (!form.date) e.date = 'Date is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (form.isRecurring && !form.recurrenceFrequency) e.recurrenceFrequency = 'Frequency is required for recurring expenses';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const payload = {
      title: form.title,
      category: form.category,
      amount: Number(form.amount),
      paymentMethod: form.paymentMethod,
      date: form.date,
      description: form.description,
      vendor: form.vendor || undefined,
      notes: form.notes || undefined,
      isRecurring: form.isRecurring,
      recurrenceFrequency: form.isRecurring ? form.recurrenceFrequency : undefined,
    };

    try {
      if (isEdit) {
        await api.put(`/expenses/${expense._id}`, payload);
        onSaved('Expense updated');
      } else {
        await api.post('/expenses', payload);
        onSaved('Expense created');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save expense';
      setErrors({ general: msg });
    } finally {
      setSaving(false);
    }
  }

  const footer = (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-2.5 rounded-full bg-surface text-on-surface hover:bg-surface-container-high transition-colors font-item-title text-item-title"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="expense-form"
        disabled={saving}
        className="px-5 py-2.5 rounded-full bg-primary text-on-primary hover:opacity-90 transition-opacity font-item-title text-item-title disabled:opacity-60"
      >
        {saving ? 'Saving...' : isEdit ? 'Update Expense' : 'Create Expense'}
      </button>
    </div>
  );

  return (
    <ModalShell
      title={isEdit ? 'Edit Expense' : 'New Expense'}
      description={isEdit ? 'Update expense details' : 'Record a new business expense'}
      icon={isEdit ? Pencil : PlusCircle}
      onClose={onClose}
      footer={footer}
      maxWidth="max-w-2xl"
    >
      <form id="expense-form" onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3 rounded-xl bg-alert-tint text-alert font-body text-body">{errors.general}</div>
        )}

        <FormInput
          label="Expense Title"
          icon={Type}
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          error={errors.title}
          placeholder="e.g. Monthly rent payment"
        />

        <div>
          <label className="block font-item-title text-item-title text-on-surface-variant mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
            className={`block w-full pl-3 pr-4 py-2.5 bg-surface-container-lowest border ${errors.category ? 'border-alert' : 'border-outline-variant'} rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all`}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {errors.category && <p className="font-caption text-caption text-error mt-1">{errors.category}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Amount"
            icon={CreditCard}
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => update('amount', e.target.value)}
            error={errors.amount}
            placeholder="0.00"
          />

          <div>
            <label className="block font-item-title text-item-title text-on-surface-variant mb-1.5">Payment Method</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => update('paymentMethod', e.target.value)}
              className={`block w-full pl-3 pr-4 py-2.5 bg-surface-container-lowest border ${errors.paymentMethod ? 'border-alert' : 'border-outline-variant'} rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all`}
            >
              <option value="">Select method</option>
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            {errors.paymentMethod && <p className="font-caption text-caption text-error mt-1">{errors.paymentMethod}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Expense Date"
            icon={Calendar}
            type="date"
            value={form.date}
            onChange={(e) => update('date', e.target.value)}
            error={errors.date}
          />

          <FormInput
            label="Vendor / Supplier (Optional)"
            icon={Store}
            value={form.vendor}
            onChange={(e) => update('vendor', e.target.value)}
            placeholder="e.g. ABC Supplies"
          />
        </div>

        <div>
          <label className="block font-item-title text-item-title text-on-surface-variant mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Brief description of the expense"
            className={`block w-full px-3 py-2.5 bg-surface-container-lowest border ${errors.description ? 'border-alert' : 'border-outline-variant'} rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none`}
          />
          {errors.description && <p className="font-caption text-caption text-error mt-1">{errors.description}</p>}
        </div>

        <FormInput
          label="Notes (Optional)"
          icon={StickyNote}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Additional notes"
        />

        {/* Recurring Toggle */}
        <div className="bg-surface rounded-xl p-4 border border-outline-variant/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Repeat size={20} strokeWidth={1.8} className="text-on-surface-variant shrink-0" />
              <div className="min-w-0">
                <p className="font-item-title text-item-title text-on-surface">Recurring Expense</p>
                <p className="font-caption text-[11px] text-on-surface-variant">Automatically repeat this expense on a schedule</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => update('isRecurring', !form.isRecurring)}
              className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${form.isRecurring ? 'bg-primary' : 'bg-surface-container-high'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-paper rounded-full shadow transition-transform ${form.isRecurring ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {form.isRecurring && (
            <div className="mt-4">
              <label className="block font-item-title text-item-title text-on-surface-variant mb-1.5">Frequency</label>
              <select
                value={form.recurrenceFrequency}
                onChange={(e) => update('recurrenceFrequency', e.target.value)}
                className={`block w-full pl-3 pr-4 py-2.5 bg-surface-container-lowest border ${errors.recurrenceFrequency ? 'border-alert' : 'border-outline-variant'} rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all`}
              >
                <option value="">Select frequency</option>
                {RECURRENCE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              {errors.recurrenceFrequency && <p className="font-caption text-caption text-error mt-1">{errors.recurrenceFrequency}</p>}
            </div>
          )}
        </div>
      </form>
    </ModalShell>
  );
}
