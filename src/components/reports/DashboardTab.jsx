import { useState, useEffect } from 'react';
import { CreditCard, UtensilsCrossed, Coffee, Store, Utensils, CircleMinus, Landmark, Clock, Users, History, CircleX, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { StatCard, SectionCard, DataTable, Badge, PKR } from './shared';

const STAT_CARDS = [
  { key: 'todayRevenue', label: 'Today Revenue', icon: CreditCard, format: PKR },
  { key: 'todayTableRevenue', label: 'Table Revenue', icon: UtensilsCrossed, format: PKR },
  { key: 'todaySessionCafeRevenue', label: 'Session Cafe Revenue', icon: Coffee, format: PKR },
  { key: 'todayWalkInCafeRevenue', label: 'Walk-in Cafe Revenue', icon: Store, format: PKR },
  { key: 'todayTotalCafeRevenue', label: 'Total Cafe Revenue', icon: Utensils, format: PKR },
  { key: 'todayExpenses', label: 'Today Expenses', icon: CircleMinus, format: PKR },
  { key: 'todayNetProfit', label: 'Net Profit', icon: Landmark, format: PKR },
  { key: 'pendingCount', label: 'Pending Payments', icon: Clock },
  { key: 'totalCustomers', label: 'Total Customers', icon: Users },
];

const SESSION_COLUMNS = [
  {
    key: 'tableNumber',
    label: 'Table #',
    render: (r) => r.table?.tableNumber ?? '—',
  },
  {
    key: 'customerName',
    label: 'Customer',
    render: (r) => r.customer?.name ?? '—',
  },
  {
    key: 'status',
    label: 'Status',
    render: (r) => {
      const variant = { completed: 'success', active: 'primary', pending: 'warning' }[r.status] || 'default';
      return <Badge variant={variant}>{r.status || '—'}</Badge>;
    },
  },
  {
    key: 'finalAmount',
    label: 'Amount',
    render: (r) => PKR(r.finalAmount),
  },
];

export default function DashboardTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get('/reports/dashboard')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const statValues = {
    todayRevenue: data?.todayRevenue,
    todayTableRevenue: data?.todayTableRevenue,
    todaySessionCafeRevenue: data?.todaySessionCafeRevenue,
    todayWalkInCafeRevenue: data?.todayWalkInCafeRevenue,
    todayTotalCafeRevenue: data?.todayTotalCafeRevenue,
    todayExpenses: data?.todayExpenses,
    todayNetProfit: data?.todayNetProfit,
    pendingCount: data?.pendingPayments?.count,
    totalCustomers: data?.totalCustomers,
  };

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="bg-alert-tint/20 text-alert font-body text-body rounded-xl p-4 flex items-center gap-2">
          <CircleX size={18} strokeWidth={1.8} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {STAT_CARDS.map((s) => {
          const raw = statValues[s.key];
          const display = loading ? '...' : s.format ? s.format(raw) : raw ?? '—';
          return <StatCard key={s.key} label={s.label} value={display} icon={s.icon} />;
        })}
      </div>

      <SectionCard title="Recent Sessions" icon={History}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable columns={SESSION_COLUMNS} rows={data?.recentSessions || []} emptyText="No recent sessions" />
        )}
      </SectionCard>
    </div>
  );
}
