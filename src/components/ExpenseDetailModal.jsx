import { useState } from 'react';
import {
  Receipt, Type, Tag, CreditCard, Calendar, Store, FileText, StickyNote,
  User, BadgeCheck, Clock, Check, X, Pencil, Trash2, Repeat
} from 'lucide-react';
import api from '../lib/api';
import ModalShell from './ModalShell';
import ConfirmModal from './ConfirmModal';
import { formatCurrency } from '../lib/currency';

const CATEGORY_LABELS = {
  rent: 'Rent', electricity: 'Electricity', water: 'Water', internet: 'Internet',
  salaries: 'Salaries', purchases: 'Purchases', repairs: 'Repairs',
  maintenance: 'Maintenance', cleaning: 'Cleaning', marketing: 'Marketing',
  fuel: 'Fuel', office_supplies: 'Office Supplies', taxes: 'Taxes',
  miscellaneous: 'Miscellaneous',
};

const PAYMENT_METHOD_LABELS = {
  cash: 'Cash', card: 'Card', bank_transfer: 'Bank Transfer', mobile_wallet: 'Mobile Wallet',
};

const STATUS_STYLES = {
  pending: { bg: 'bg-warn-tint', text: 'text-warn', label: 'Pending' },
  approved: { bg: 'bg-good-tint', text: 'text-good', label: 'Approved' },
  rejected: { bg: 'bg-alert-tint', text: 'text-alert', label: 'Rejected' },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function DetailRow({ label, value, icon: IconComponent }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-outline-variant/10 last:border-0">
      <span className="font-body text-body text-on-surface-variant flex items-center gap-2">
        {IconComponent && <IconComponent size={18} strokeWidth={1.8} />}
        {label}
      </span>
      <span className="font-item-title text-item-title text-on-surface text-right max-w-[60%]">{value || '—'}</span>
    </div>
  );
}

export default function ExpenseDetailModal({ expense, onClose, onEdit, onStatusChange, onDelete }) {
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const statusStyle = STATUS_STYLES[expense.status] || STATUS_STYLES.pending;

  async function handleStatusUpdate(newStatus) {
    setActionLoading(true);
    try {
      await api.put(`/expenses/${expense._id}/${newStatus}`);
      onStatusChange();
    } catch {
      // handled by parent
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    setActionLoading(true);
    try {
      await api.delete(`/expenses/${expense._id}`);
      onDelete(expense);
    } catch {
      // handled by parent
    } finally {
      setActionLoading(false);
    }
  }

  const footer = (
    <div className="flex flex-wrap justify-between gap-2">
      <div className="flex gap-2">
        {expense.status === 'pending' && (
          <>
            <button
              onClick={() => handleStatusUpdate('approve')}
              disabled={actionLoading}
              className="px-4 py-2.5 rounded-full bg-good-tint text-good hover:opacity-90 transition-opacity font-item-title text-item-title disabled:opacity-60 flex items-center gap-1.5"
            >
              <Check size={18} strokeWidth={1.8} /> Approve
            </button>
            <button
              onClick={() => handleStatusUpdate('reject')}
              disabled={actionLoading}
              className="px-4 py-2.5 rounded-full bg-alert-tint text-alert hover:opacity-90 transition-opacity font-item-title text-item-title disabled:opacity-60 flex items-center gap-1.5"
            >
              <X size={18} strokeWidth={1.8} /> Reject
            </button>
          </>
        )}
        {expense.status === 'rejected' && (
          <button
            onClick={() => handleStatusUpdate('approve')}
            disabled={actionLoading}
            className="px-4 py-2.5 rounded-full bg-good-tint text-good hover:opacity-90 transition-opacity font-item-title text-item-title disabled:opacity-60 flex items-center gap-1.5"
          >
            <Check size={18} strokeWidth={1.8} /> Approve
          </button>
        )}
        {expense.status === 'approved' && (
          <button
            onClick={() => handleStatusUpdate('reject')}
            disabled={actionLoading}
            className="px-4 py-2.5 rounded-full bg-alert-tint text-alert hover:opacity-90 transition-opacity font-item-title text-item-title disabled:opacity-60 flex items-center gap-1.5"
          >
            <X size={18} strokeWidth={1.8} /> Reject
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(expense)}
          className="px-4 py-2.5 rounded-full bg-surface text-on-surface hover:bg-surface-container-high transition-colors font-item-title text-item-title flex items-center gap-1.5"
        >
          <Pencil size={18} strokeWidth={1.8} /> Edit
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          className="px-4 py-2.5 rounded-full bg-alert-tint text-alert hover:opacity-90 transition-opacity font-item-title text-item-title flex items-center gap-1.5"
        >
          <Trash2 size={18} strokeWidth={1.8} /> Delete
        </button>
      </div>
    </div>
  );

  return (
    <>
      <ModalShell
        title="Expense Details"
        icon={Receipt}
        onClose={onClose}
        footer={footer}
        maxWidth="max-w-xl"
      >
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-6">
          <span className={`inline-flex items-center rounded-full px-3 py-1.5 font-item-title text-item-title ${statusStyle.bg} ${statusStyle.text}`}>
            {statusStyle.label}
          </span>
          {expense.isRecurring && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-data-tint text-data font-caption text-caption">
              <Repeat size={16} strokeWidth={1.8} />
              Recurring ({expense.recurrenceFrequency})
            </span>
          )}
        </div>

        {/* Amount */}
        <div className="bg-surface rounded-xl p-4 mb-6 text-center">
          <p className="font-caption text-caption text-on-surface-variant mb-1">Amount</p>
          <p className="font-headline text-headline-mobile text-on-background">{formatCurrency(expense.amount)}</p>
        </div>

        {/* Details */}
        <div>
          <DetailRow icon={Type} label="Title" value={expense.title} />
          <DetailRow icon={Tag} label="Category" value={CATEGORY_LABELS[expense.category] || expense.category} />
          <DetailRow icon={CreditCard} label="Payment Method" value={PAYMENT_METHOD_LABELS[expense.paymentMethod] || expense.paymentMethod} />
          <DetailRow icon={Calendar} label="Date" value={formatDate(expense.date)} />
          <DetailRow icon={Store} label="Vendor" value={expense.vendor} />
          <DetailRow icon={FileText} label="Description" value={expense.description} />
          {expense.notes && <DetailRow icon={StickyNote} label="Notes" value={expense.notes} />}
          <DetailRow icon={User} label="Created By" value={expense.createdBy?.name || '—'} />
          {expense.approvedBy && (
            <DetailRow icon={BadgeCheck} label="Approved By" value={expense.approvedBy?.name || '—'} />
          )}
          {expense.approvedAt && (
            <DetailRow icon={Clock} label="Approved At" value={formatDate(expense.approvedAt)} />
          )}
        </div>
      </ModalShell>

      {confirmDelete && (
        <ConfirmModal
          title="Delete Expense"
          description={`Are you sure you want to delete "${expense.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          icon={Trash2}
          onClose={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
          loading={actionLoading}
        />
      )}
    </>
  );
}
