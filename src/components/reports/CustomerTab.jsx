import { useState, useEffect } from 'react';
import { Users, UserPlus, Repeat, AlertTriangle, Wallet, TrendingUp, Trophy, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { StatCard, SectionCard, DataTable, Badge, PKR } from './shared';

const STAT_CARDS = [
  { key: 'totalCustomers', label: 'Total Customers', icon: Users },
  { key: 'newCustomers', label: 'New (30d)', icon: UserPlus },
  { key: 'returningCustomers', label: 'Returning', icon: Repeat },
  { key: 'withOutstanding', label: 'With Outstanding', icon: AlertTriangle },
  { key: 'totalOutstanding', label: 'Total Outstanding', icon: Wallet, format: PKR },
  { key: 'averageSpending', label: 'Avg Spending', icon: TrendingUp, format: PKR },
];

const TOP_SPENDERS_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'visitCount', label: 'Visits' },
  {
    key: 'lifetimeSpending',
    label: 'Lifetime Spending',
    render: (r) => PKR(r.lifetimeSpending),
  },
];

export default function CustomerTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get('/reports/customer')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load customer report'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
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

      <SectionCard title="Top Spenders" icon={Trophy}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable columns={TOP_SPENDERS_COLUMNS} rows={data?.topSpenders || []} emptyText="No customer data available" />
        )}
      </SectionCard>
    </div>
  );
}
