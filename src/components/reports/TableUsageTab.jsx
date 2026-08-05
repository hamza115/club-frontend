import { useState, useEffect } from 'react';
import { UtensilsCrossed, Timer, BarChart3, CircleX, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import DateRangePicker from './DateRangePicker';
import { StatCard, SectionCard, DataTable, Badge, PKR, formatDuration, formatPercent } from './shared';

const STAT_CARDS = [
  { key: 'totalTables', label: 'Total Tables', icon: UtensilsCrossed },
  { key: 'totalSessions', label: 'Total Sessions', icon: Timer },
];

const COLUMNS = [
  { key: 'tableNumber', label: 'Table #' },
  { key: 'sessionCount', label: 'Sessions' },
  { key: 'totalRevenue', label: 'Total Revenue', render: (r) => PKR(r.totalRevenue) },
  { key: 'tableRevenue', label: 'Table Revenue', render: (r) => PKR(r.tableRevenue) },
  { key: 'cafeRevenue', label: 'Cafe Revenue', render: (r) => PKR(r.cafeRevenue) },
  { key: 'avgDuration', label: 'Avg Duration', render: (r) => formatDuration(r.avgDuration) },
  {
    key: 'occupancyPercent',
    label: 'Occupancy %',
    render: (r) => {
      const pct = r.occupancyPercent;
      let variant = 'danger';
      if (pct > 70) variant = 'success';
      else if (pct >= 30) variant = 'warning';
      return <Badge variant={variant}>{formatPercent(pct)}</Badge>;
    },
  },
];

export default function TableUsageTab() {
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
      .get('/reports/table-usage', { params })
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load table usage report'))
      .finally(() => setLoading(false));
  }, [range.type, range.start, range.end]);

  const totalSessions = data?.tables?.reduce((sum, t) => sum + (t.sessionCount || 0), 0) ?? 0;

  const statValues = {
    totalTables: data?.totalTables,
    totalSessions,
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

      <SectionCard title="Table Performance" icon={BarChart3}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable columns={COLUMNS} rows={data?.tables || []} emptyText="No table usage data for this period" />
        )}
      </SectionCard>
    </div>
  );
}
