import { useState, useEffect } from 'react';
import { CreditCard, Wallet, TrendingUp, Package, ShoppingCart, CircleX, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import DateRangePicker from './DateRangePicker';
import { StatCard, SectionCard, DataTable, Badge, PKR } from './shared';

const STAT_CARDS = [
  { key: 'totalRevenue', label: 'Total Revenue', icon: CreditCard, format: PKR },
  { key: 'totalCost', label: 'Total Cost', icon: Wallet, format: PKR },
  { key: 'totalProfit', label: 'Total Profit', icon: TrendingUp, format: PKR },
  { key: 'totalQtySold', label: 'Total Qty Sold', icon: Package },
];

const PRODUCT_COLUMNS = [
  { key: 'name', label: 'Product' },
  { key: 'category', label: 'Category' },
  { key: 'qtySold', label: 'Qty Sold' },
  { key: 'revenue', label: 'Revenue', render: (r) => PKR(r.revenue) },
  { key: 'purchaseCost', label: 'Purchase Cost', render: (r) => PKR(r.purchaseCost) },
  { key: 'profit', label: 'Profit', render: (r) => PKR(r.profit) },
  {
    key: 'remainingStock',
    label: 'Stock',
    render: (r) => {
      const stock = r.remainingStock;
      const threshold = r.lowStockThreshold ?? 5;
      let variant = 'success';
      if (stock === 0) variant = 'danger';
      else if (stock <= threshold) variant = 'warning';
      return <Badge variant={variant}>{stock}</Badge>;
    },
  },
];

export default function ProductSalesTab() {
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
      .get('/reports/product-sales', { params })
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load product sales report'))
      .finally(() => setLoading(false));
  }, [range.type, range.start, range.end]);

  return (
    <div className="flex flex-col gap-6">
      <DateRangePicker value={range} onChange={setRange} />

      {error && (
        <div className="bg-alert-tint/20 text-alert font-body text-body rounded-xl p-4 flex items-center gap-2">
          <CircleX size={18} strokeWidth={1.8} />
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {STAT_CARDS.map((s) => {
          const raw = data?.[s.key];
          const display = loading ? '—' : s.format ? s.format(raw) : raw ?? '—';
          return <StatCard key={s.key} label={s.label} value={display} icon={s.icon} />;
        })}
      </div>

      {/* Product Sales */}
      <SectionCard title="Product Sales" icon={ShoppingCart}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable columns={PRODUCT_COLUMNS} rows={data?.products || []} emptyText="No product sales data for this period" />
        )}
      </SectionCard>
    </div>
  );
}
