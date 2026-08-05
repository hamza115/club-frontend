import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, History, Clock, UtensilsCrossed, Star, Users, CircleX, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { StatCard, SectionCard, DataTable, Badge, PKR, formatPercent } from './shared';

const PEAK_HOURS_COLUMNS = [
  { key: 'label', label: 'Hour' },
  { key: 'sessions', label: 'Sessions' },
];

const BEST_TABLES_COLUMNS = [
  { key: 'tableNumber', label: 'Table #' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'revenue', label: 'Revenue', render: (r) => PKR(r.revenue) },
];

const TOP_PRODUCTS_COLUMNS = [
  { key: 'name', label: 'Product' },
  { key: 'qty', label: 'Qty Sold' },
  { key: 'revenue', label: 'Revenue', render: (r) => PKR(r.revenue) },
];

const TOP_CUSTOMERS_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'visitCount', label: 'Visits' },
  { key: 'lifetimeSpending', label: 'Lifetime Spending', render: (r) => PKR(r.lifetimeSpending) },
];

export default function InsightsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get('/reports/insights')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load insights'))
      .finally(() => setLoading(false));
  }, []);

  const revenueGrowth = data?.revenueGrowth;
  const currentPeriodRevenue = data?.currentPeriodRevenue;
  const previousPeriodRevenue = data?.previousPeriodRevenue;

  const growthVariant = revenueGrowth != null ? (revenueGrowth >= 0 ? 'success' : 'danger') : 'default';

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="bg-alert-tint/20 text-alert font-body text-body rounded-xl p-4 flex items-center gap-2">
          <CircleX size={18} strokeWidth={1.8} />
          {error}
        </div>
      )}

      {/* Revenue Growth */}
      <SectionCard title="Revenue Growth" icon={TrendingUp}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="font-title text-display text-primary">
                {revenueGrowth != null ? formatPercent(revenueGrowth) : '—'}
              </span>
              {revenueGrowth != null && (
                <Badge variant={growthVariant}>
                  {revenueGrowth >= 0 ? '↑ Growth' : '↓ Decline'}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <StatCard
                label="Current Period"
                value={loading ? '—' : PKR(currentPeriodRevenue)}
                icon={Calendar}
              />
              <StatCard
                label="Previous Period"
                value={loading ? '—' : PKR(previousPeriodRevenue)}
                icon={History}
              />
            </div>
          </div>
        )}
      </SectionCard>

      {/* Peak Hours */}
      <SectionCard title="Peak Hours" icon={Clock}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable columns={PEAK_HOURS_COLUMNS} rows={data?.peakHours || []} emptyText="No peak hours data available" />
        )}
      </SectionCard>

      {/* Best Tables */}
      <SectionCard title="Best Tables" icon={UtensilsCrossed}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable columns={BEST_TABLES_COLUMNS} rows={data?.bestTables || []} emptyText="No table data available" />
        )}
      </SectionCard>

      {/* Top Products */}
      <SectionCard title="Top Products" icon={Star}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable columns={TOP_PRODUCTS_COLUMNS} rows={data?.topProducts || []} emptyText="No product data available" />
        )}
      </SectionCard>

      {/* Top Customers */}
      <SectionCard title="Top Customers" icon={Users}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable columns={TOP_CUSTOMERS_COLUMNS} rows={data?.topCustomers || []} emptyText="No customer data available" />
        )}
      </SectionCard>
    </div>
  );
}
