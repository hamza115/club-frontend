import { useState, useEffect } from 'react';
import { Receipt, CreditCard, Wallet, ClipboardCheck, CircleX, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import DateRangePicker from './DateRangePicker';
import { StatCard, SectionCard, DataTable, Badge, PKR } from './shared';

const STAT_CARDS = [
  { key: 'totalPayments', label: 'Total Payments', icon: Receipt },
  { key: 'totalAmount', label: 'Total Amount', icon: CreditCard, format: PKR },
];

const METHOD_COLUMNS = [
  { key: 'method', label: 'Method' },
  {
    key: 'amount',
    label: 'Amount',
    render: (r) => PKR(r.amount),
  },
  {
    key: 'count',
    label: 'Count',
  },
];

const STATUS_COLUMNS = [
  {
    key: 'status',
    label: 'Status',
    render: (r) => {
      const variant = { paid: 'success', partial: 'warning', pending: 'danger' }[r.status] || 'default';
      return <Badge variant={variant}>{r.status}</Badge>;
    },
  },
  {
    key: 'total',
    label: 'Total',
    render: (r) => PKR(r.total),
  },
  {
    key: 'paid',
    label: 'Paid',
    render: (r) => PKR(r.paid),
  },
  {
    key: 'outstanding',
    label: 'Outstanding',
    render: (r) => PKR(r.outstanding),
  },
  {
    key: 'count',
    label: 'Count',
  },
];

export default function PaymentTab() {
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
      .get('/reports/payment', { params })
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load payment report'))
      .finally(() => setLoading(false));
  }, [range.type, range.start, range.end]);

  const byMethodRows = data
    ? Object.keys(data.byMethod || {}).map((method) => ({
        method: method.charAt(0).toUpperCase() + method.slice(1),
        amount: data.byMethod[method],
        count: data.byMethodCount?.[method] || 0,
      }))
    : [];

  const statValues = {
    totalPayments: data?.totalPayments,
    totalAmount: data?.totalAmount,
  };

  return (
    <div className="flex flex-col gap-6">
      <DateRangePicker value={range} onChange={setRange} />

      {error && (
        <div className="bg-alert-tint/20 text-alert font-body text-body rounded-xl p-4 flex items-center gap-2">
          <CircleX size={18} strokeWidth={1.8} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {STAT_CARDS.map((s) => {
          const raw = statValues[s.key];
          const display = loading ? '—' : s.format ? s.format(raw) : raw ?? '—';
          return <StatCard key={s.key} label={s.label} value={display} icon={s.icon} />;
        })}
      </div>

      <SectionCard title="By Payment Method" icon={Wallet}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable columns={METHOD_COLUMNS} rows={byMethodRows} emptyText="No payment method data for this period" />
        )}
      </SectionCard>

      <SectionCard title="Session Payment Status" icon={ClipboardCheck}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable
            columns={STATUS_COLUMNS}
            rows={data?.sessionPayments || []}
            emptyText="No session payment data for this period"
          />
        )}
      </SectionCard>
    </div>
  );
}
