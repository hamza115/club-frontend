import { useState, useEffect } from 'react';
import { Timer, CheckCircle2, CreditCard, Clock, TrendingUp, ArrowUp, ArrowDown, FileText, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import DateRangePicker from './DateRangePicker';
import { StatCard, SectionCard, DataTable, Badge, PKR, formatDuration, formatPercent } from './shared';

const STAT_CARDS = [
  { key: 'totalSessions', label: 'Total Sessions', icon: Timer },
  { key: 'completedSessions', label: 'Completed', icon: CheckCircle2 },
  { key: 'totalRevenue', label: 'Total Revenue', icon: CreditCard, format: PKR },
  { key: 'avgDuration', label: 'Avg Duration', icon: Clock, format: formatDuration },
  { key: 'avgValue', label: 'Avg Value', icon: TrendingUp, format: PKR },
  { key: 'highestBill', label: 'Highest Bill', icon: ArrowUp, format: PKR },
  { key: 'lowestBill', label: 'Lowest Bill', icon: ArrowDown, format: PKR },
];

const COLUMNS = [
  { key: 'receiptNumber', label: 'Receipt #' },
  { key: 'customerName', label: 'Customer' },
  { key: 'tableNumber', label: 'Table' },
  { key: 'duration', label: 'Duration', render: (r) => formatDuration(r.duration) },
  { key: 'tableCharges', label: 'Table Charges', render: (r) => PKR(r.tableCharges) },
  { key: 'cafeCharges', label: 'Cafe Charges', render: (r) => PKR(r.cafeCharges) },
  { key: 'finalAmount', label: 'Total', render: (r) => PKR(r.finalAmount) },
  {
    key: 'paymentStatus',
    label: 'Payment Status',
    render: (r) => {
      const variant = { paid: 'success', partial: 'warning', pending: 'danger' }[r.paymentStatus] || 'default';
      return <Badge variant={variant}>{r.paymentStatus || '—'}</Badge>;
    },
  },
];

export default function SessionTab() {
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
      .get('/reports/sessions', { params })
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load session report'))
      .finally(() => setLoading(false));
  }, [range.type, range.start, range.end]);

  return (
    <div className="flex flex-col gap-6">
      <DateRangePicker value={range} onChange={setRange} />

      {error && (
        <div className="bg-alert-tint/20 text-alert font-body text-body rounded-xl p-4 flex items-center gap-2">
          <AlertCircle size={18} strokeWidth={1.8} className="text-alert" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 md:gap-4">
        {STAT_CARDS.map((s) => {
          const raw = data?.[s.key];
          const display = loading ? '—' : s.format ? s.format(raw) : raw ?? '—';
          return <StatCard key={s.key} label={s.label} value={display} icon={s.icon} />;
        })}
      </div>

      <SectionCard title="Session Details" icon={FileText}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable columns={COLUMNS} rows={data?.sessions || []} emptyText="No sessions found for this period" />
        )}
      </SectionCard>
    </div>
  );
}
