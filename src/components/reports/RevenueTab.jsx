import { useState, useEffect } from 'react';
import { CreditCard, UtensilsCrossed, Coffee, Store, Utensils, BadgePercent, TrendingUp, BarChart3, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import DateRangePicker from './DateRangePicker';
import { StatCard, SectionCard, PKR, formatPercent } from './shared';

const STAT_CARDS = [
  { key: 'totalRevenue', label: 'Total Revenue', icon: CreditCard, format: PKR },
  { key: 'totalTableRevenue', label: 'Table Revenue', icon: UtensilsCrossed, format: PKR },
  { key: 'totalSessionCafeRevenue', label: 'Session Cafe Revenue', icon: Coffee, format: PKR },
  { key: 'totalWalkInCafeRevenue', label: 'Walk-in Cafe Revenue', icon: Store, format: PKR },
  { key: 'totalCafeRevenue', label: 'Total Cafe Revenue', icon: Utensils, format: PKR },
  { key: 'totalDiscounts', label: 'Discounts', icon: BadgePercent, format: PKR },
  { key: 'averagePerSession', label: 'Avg Per Session', icon: TrendingUp, format: PKR },
];

export default function RevenueTab() {
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
      .get('/reports/revenue', { params })
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load revenue report'))
      .finally(() => setLoading(false));
  }, [range.type, range.start, range.end]);

  const totalRevenue = data?.totalRevenue || 0;
  const tableRevenue = data?.totalTableRevenue || 0;
  const cafeRevenue = data?.totalCafeRevenue || 0;
  const tablePct = totalRevenue > 0 ? (tableRevenue / totalRevenue) * 100 : 0;
  const cafePct = totalRevenue > 0 ? (cafeRevenue / totalRevenue) * 100 : 0;

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

      <SectionCard title="Revenue Breakdown" icon={BarChart3}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Stacked bar */}
            <div className="flex h-8 rounded-xl overflow-hidden bg-surface-container">
              {tablePct > 0 && (
                <div
                  className="bg-primary flex items-center justify-center transition-all duration-300"
                  style={{ width: `${tablePct}%` }}
                >
                  {tablePct >= 15 && (
                    <span className="font-caption text-caption text-on-primary">{formatPercent(tablePct)}</span>
                  )}
                </div>
              )}
              {cafePct > 0 && (
                <div
                  className="bg-tertiary flex items-center justify-center transition-all duration-300"
                  style={{ width: `${cafePct}%` }}
                >
                  {cafePct >= 15 && (
                    <span className="font-caption text-caption text-on-tertiary">{formatPercent(cafePct)}</span>
                  )}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-primary" />
                <span className="font-body text-body text-on-surface">
                  Table Revenue — {PKR(tableRevenue)} ({formatPercent(tablePct)})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-tertiary" />
                <span className="font-body text-body text-on-surface">
                  Cafe Revenue — {PKR(cafeRevenue)} ({formatPercent(cafePct)})
                </span>
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
