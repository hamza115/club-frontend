import { useState, useEffect } from 'react';
import { CreditCard, Store, Coffee, Receipt, Package, TrendingUp, Star, Folder, Calendar, CircleX, Loader2, Play } from 'lucide-react';
import api from '../../lib/api';
import { StatCard, SectionCard, DataTable, PKR, formatDate } from './shared';

const STAT_CARDS = [
  { key: 'totalCafeRevenue', label: 'Total Cafe Revenue', icon: CreditCard, format: PKR },
  { key: 'totalWalkInRevenue', label: 'Walk-in Revenue', icon: Store, format: PKR },
  { key: 'totalSessionCafeRevenue', label: 'Session Cafe Revenue', icon: Coffee, format: PKR },
  { key: 'totalOrders', label: 'Total Orders', icon: Receipt },
  { key: 'totalItemsSold', label: 'Total Items', icon: Package },
  { key: 'avgOrderValue', label: 'Avg Order Value', icon: TrendingUp, format: PKR },
];

const PRODUCT_COLUMNS = [
  { key: 'name', label: 'Product' },
  { key: 'category', label: 'Category' },
  { key: 'totalQuantity', label: 'Qty Sold' },
  { key: 'totalRevenue', label: 'Revenue', render: (r) => PKR(r.totalRevenue) },
];

const CATEGORY_COLUMNS = [
  { key: 'category', label: 'Category' },
  { key: 'revenue', label: 'Revenue', render: (r) => PKR(r.revenue) },
];

const DAILY_COLUMNS = [
  { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
  { key: 'walkInRevenue', label: 'Walk-in Revenue', render: (r) => PKR(r.walkInRevenue) },
  { key: 'sessionCafeRevenue', label: 'Session Cafe Revenue', render: (r) => PKR(r.sessionCafeRevenue) },
  { key: 'totalRevenue', label: 'Total Revenue', render: (r) => PKR(r.totalRevenue) },
  { key: 'orderCount', label: 'Orders' },
];

export default function CafeSalesTab() {
  const now = new Date();
  const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const defaultEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError(null);
    api
      .get('/reports/cafe-sales', { params: { startDate, endDate } })
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load cafe sales report'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Date range inputs */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-caption text-caption text-on-surface-variant">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-paper border border-outline-variant/30 rounded-lg px-3 py-1.5 font-caption text-caption text-on-surface focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-caption text-caption text-on-surface-variant">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-paper border border-outline-variant/30 rounded-lg px-3 py-1.5 font-caption text-caption text-on-surface focus:outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={fetchData}
          disabled={loading || !startDate || !endDate}
          className="bg-primary text-on-primary px-5 py-1.5 rounded-lg font-caption text-caption shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          <Play size={16} strokeWidth={1.8} />
          Generate
        </button>
      </div>

      {error && (
        <div className="bg-alert-tint/20 text-alert font-body text-body rounded-xl p-4 flex items-center gap-2">
          <CircleX size={18} strokeWidth={1.8} />
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
        {STAT_CARDS.map((s) => {
          const raw = data?.summary?.[s.key];
          const display = loading ? '—' : s.format ? s.format(raw) : raw ?? '—';
          return <StatCard key={s.key} label={s.label} value={display} icon={s.icon} />;
        })}
      </div>

      {/* Top Products */}
      <SectionCard title="Top Products" icon={Star}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable columns={PRODUCT_COLUMNS} rows={data?.products || []} emptyText="No product data for this period" />
        )}
      </SectionCard>

      {/* Category Breakdown */}
      <SectionCard title="Category Breakdown" icon={Folder}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable columns={CATEGORY_COLUMNS} rows={data?.categoryBreakdown || []} emptyText="No category data for this period" />
        )}
      </SectionCard>

      {/* Daily Breakdown */}
      <SectionCard title="Daily Breakdown" icon={Calendar}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable columns={DAILY_COLUMNS} rows={data?.dailyBreakdown || []} emptyText="No daily data for this period" />
        )}
      </SectionCard>
    </div>
  );
}
