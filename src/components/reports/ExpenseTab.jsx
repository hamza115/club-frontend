import { useState, useEffect } from 'react';
import { CreditCard, Receipt, Folder, CircleX, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import DateRangePicker from './DateRangePicker';
import { StatCard, SectionCard, DataTable, PKR } from './shared';

const STAT_CARDS = [
  { key: 'totalExpenses', label: 'Total Expenses', icon: CreditCard, format: PKR },
  { key: 'expenseCount', label: 'Expense Count', icon: Receipt },
];

const CATEGORY_COLUMNS = [
  {
    key: 'category',
    label: 'Category',
    render: (r) => r.category.charAt(0).toUpperCase() + r.category.slice(1),
  },
  {
    key: 'amount',
    label: 'Amount',
    render: (r) => PKR(r.amount),
  },
];

const METHOD_COLUMNS = [
  {
    key: 'method',
    label: 'Method',
    render: (r) => r.method.charAt(0).toUpperCase() + r.method.slice(1),
  },
  {
    key: 'amount',
    label: 'Amount',
    render: (r) => PKR(r.amount),
  },
];

function toSortedRows(obj, keyName) {
  if (!obj) return [];
  return Object.entries(obj)
    .map(([key, amount]) => ({ [keyName]: key, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export default function ExpenseTab() {
  const [range, setRange] = useState({ type: 'monthly' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = { type: range.type };
    if (range.start) params.start = range.start;
    if (range.end) params.end = range.end;

    setLoading(true);
    setError(null);
    api
      .get('/reports/expense', { params })
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load expense report'))
      .finally(() => setLoading(false));
  }, [range.type, range.start, range.end]);

  const categoryRows = toSortedRows(data?.byCategory, 'category');
  const methodRows = toSortedRows(data?.byPaymentMethod, 'method');

  return (
    <div className="flex flex-col gap-6">
      <DateRangePicker value={range} onChange={setRange} />

      {error && (
        <div className="bg-alert-tint/20 text-alert font-body text-body rounded-xl p-4 flex items-center gap-2">
          <CircleX size={18} strokeWidth={1.8} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {STAT_CARDS.map((s) => {
          const raw = data?.[s.key];
          const display = loading ? '—' : s.format ? s.format(raw) : raw ?? '—';
          return <StatCard key={s.key} label={s.label} value={display} icon={s.icon} />;
        })}
      </div>

      <SectionCard title="By Category" icon={Folder}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable
            columns={CATEGORY_COLUMNS}
            rows={categoryRows}
            emptyText="No expense data by category"
          />
        )}
      </SectionCard>

      <SectionCard title="By Payment Method" icon={CreditCard}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable
            columns={METHOD_COLUMNS}
            rows={methodRows}
            emptyText="No expense data by payment method"
          />
        )}
      </SectionCard>
    </div>
  );
}
