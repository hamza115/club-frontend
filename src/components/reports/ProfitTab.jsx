import { useState, useEffect } from 'react';
import { CreditCard, UtensilsCrossed, Coffee, TrendingDown, PiggyBank, Percent, BarChart3, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import DateRangePicker from './DateRangePicker';
import { StatCard, SectionCard, PKR, formatPercent } from './shared';

const STAT_CARDS = [
  { key: 'grossRevenue', label: 'Gross Revenue', icon: CreditCard, format: PKR },
  { key: 'totalTableRevenue', label: 'Table Revenue', icon: UtensilsCrossed, format: PKR },
  { key: 'totalCafeRevenue', label: 'Cafe Revenue', icon: Coffee, format: PKR },
  { key: 'totalExpenses', label: 'Total Expenses', icon: TrendingDown, format: PKR },
  { key: 'netProfit', label: 'Net Profit', icon: PiggyBank, format: PKR },
  { key: 'profitMargin', label: 'Profit Margin', icon: Percent, format: formatPercent },
];

export default function ProfitTab() {
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
      .get('/reports/profit', { params })
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load profit report'))
      .finally(() => setLoading(false));
  }, [range.type, range.start, range.end]);

  const revenue = data?.grossRevenue || 0;
  const expenses = data?.totalExpenses || 0;
  const profit = data?.netProfit || 0;
  const barMax = Math.max(revenue, expenses, Math.abs(profit), 1);

  return (
    <div className="flex flex-col gap-6">
      <DateRangePicker value={range} onChange={setRange} />

      {error && (
        <div className="bg-alert-tint/20 text-alert font-body text-body rounded-xl p-4 flex items-center gap-2">
          <AlertCircle size={18} strokeWidth={1.8} className="text-alert" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
        {STAT_CARDS.map((s) => {
          const raw = data?.[s.key];
          const display = loading ? '—' : s.format ? s.format(raw) : raw ?? '—';
          return <StatCard key={s.key} label={s.label} value={display} icon={s.icon} />;
        })}
      </div>

      <SectionCard title="Profit Summary" icon={BarChart3}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Revenue Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-caption text-caption text-on-surface-variant">Total Revenue</span>
                <span className="font-body text-body text-primary">{PKR(revenue)}</span>
              </div>
              <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/20 rounded-full transition-all duration-500"
                  style={{ width: `${(revenue / barMax) * 100}%` }}
                />
              </div>
            </div>

            {/* Expenses Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-caption text-caption text-on-surface-variant">Total Expenses</span>
                <span className="font-body text-body text-alert">{PKR(expenses)}</span>
              </div>
              <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-alert/20 rounded-full transition-all duration-500"
                  style={{ width: `${(expenses / barMax) * 100}%` }}
                />
              </div>
            </div>

            {/* Net Profit Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-caption text-caption text-on-surface-variant">Net Profit</span>
                <span className={`font-body text-body ${profit >= 0 ? 'text-good' : 'text-alert'}`}>
                  {PKR(profit)}
                </span>
              </div>
              <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${profit >= 0 ? 'bg-good/20' : 'bg-alert/20'}`}
                  style={{ width: `${(Math.abs(profit) / barMax) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
