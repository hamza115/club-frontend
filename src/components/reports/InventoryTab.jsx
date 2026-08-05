import { useState, useEffect } from 'react';
import { Package, AlertTriangle, CircleX, Landmark, Store, TrendingUp, ArrowLeftRight, PackageOpen, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { StatCard, SectionCard, DataTable, Badge, PKR, formatDate } from './shared';

const STAT_CARDS = [
  { key: 'totalProducts', label: 'Total Products', icon: Package },
  { key: 'lowStockCount', label: 'Low Stock', icon: AlertTriangle, tint: 'bg-warn-tint/20' },
  { key: 'outOfStockCount', label: 'Out of Stock', icon: CircleX, tint: 'bg-alert-tint/20' },
  { key: 'totalInventoryValue', label: 'Inventory Value', icon: Landmark, format: PKR },
  { key: 'totalRetailValue', label: 'Retail Value', icon: Store, format: PKR },
  { key: 'potentialProfit', label: 'Potential Profit', icon: TrendingUp, format: PKR },
];

const LOW_STOCK_COLUMNS = [
  { key: 'name', label: 'Product' },
  { key: 'category', label: 'Category' },
  {
    key: 'stockQuantity',
    label: 'Current Stock',
    render: (r) => {
      const variant = r.stockQuantity === 0 ? 'danger' : r.stockQuantity <= r.minStockThreshold ? 'warning' : 'default';
      return <Badge variant={variant}>{r.stockQuantity}</Badge>;
    },
  },
  { key: 'minStockThreshold', label: 'Min Threshold' },
];

const MOVEMENT_COLUMNS = [
  { key: 'product', label: 'Product', render: (r) => r.product?.name || '—' },
  {
    key: 'type',
    label: 'Type',
    render: (r) => {
      const variant = { purchase: 'success', sale: 'primary', adjustment: 'warning', return: 'default' }[r.type] || 'default';
      return <Badge variant={variant}>{r.type}</Badge>;
    },
  },
  { key: 'quantity', label: 'Qty' },
  { key: 'unitPrice', label: 'Unit Price', render: (r) => PKR(r.unitPrice) },
  { key: 'totalCost', label: 'Total Cost', render: (r) => PKR(r.totalCost) },
  { key: 'createdAt', label: 'Date', render: (r) => formatDate(r.createdAt) },
  { key: 'createdBy', label: 'By', render: (r) => r.createdBy?.name || '—' },
];

export default function InventoryTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get('/reports/inventory')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load inventory report'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="bg-alert-tint/20 text-alert font-body text-body rounded-xl p-4 flex items-center gap-2">
          <CircleX size={18} strokeWidth={1.8} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {STAT_CARDS.map((s) => {
          const raw = data?.[s.key];
          const display = loading ? '—' : s.format ? s.format(raw) : raw ?? '—';
          return <StatCard key={s.key} label={s.label} value={display} icon={s.icon} tint={s.tint} />;
        })}
      </div>

      <SectionCard title="Purchases & Sales Summary" icon={ArrowLeftRight}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-paper rounded-xl p-4 flex flex-col gap-1">
              <span className="font-caption text-caption text-on-surface-variant">Purchases Qty</span>
              <span className="font-title text-title text-primary">{data?.purchases?.totalQty ?? '—'}</span>
            </div>
            <div className="bg-paper rounded-xl p-4 flex flex-col gap-1">
              <span className="font-caption text-caption text-on-surface-variant">Purchases Cost</span>
              <span className="font-title text-title text-primary">{PKR(data?.purchases?.totalCost)}</span>
            </div>
            <div className="bg-paper rounded-xl p-4 flex flex-col gap-1">
              <span className="font-caption text-caption text-on-surface-variant">Sold Qty</span>
              <span className="font-title text-title text-primary">{data?.sold?.totalQty ?? '—'}</span>
            </div>
            <div className="bg-paper rounded-xl p-4 flex flex-col gap-1">
              <span className="font-caption text-caption text-on-surface-variant">Sold Revenue</span>
              <span className="font-title text-title text-primary">{PKR(data?.sold?.totalRevenue)}</span>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Low Stock Products" icon={PackageOpen}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable
            columns={LOW_STOCK_COLUMNS}
            rows={data?.lowStockProducts || []}
            emptyText="No low stock products"
          />
        )}
      </SectionCard>

      <SectionCard title="Recent Stock Movements" icon={ArrowLeftRight}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable
            columns={MOVEMENT_COLUMNS}
            rows={data?.recentMovements || []}
            emptyText="No recent stock movements"
          />
        )}
      </SectionCard>
    </div>
  );
}
