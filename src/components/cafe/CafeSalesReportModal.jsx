import { useState } from 'react';
import api from '../../lib/api';
import ModalShell from '../ModalShell';
import { SummaryStat } from './CafeUI';
import Toast from '../Toast';
import { formatCurrency } from '../../lib/currency';
import {
  BarChart3,
  Loader2,
  ChevronRight,
  ShoppingCart,
  CircleDot,
  Package,
  CalendarDays,
  History,
  CalendarRange,
  Calendar,
  SlidersHorizontal,
  FileText,
} from 'lucide-react';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

const PERIODS = [
  { value: 'today', label: 'Today', Icon: CalendarDays },
  { value: 'yesterday', label: 'Yesterday', Icon: History },
  { value: 'lastWeek', label: 'Last Week', Icon: CalendarRange },
  { value: 'lastMonth', label: 'Last Month', Icon: Calendar },
  { value: 'custom', label: 'Custom Range', Icon: SlidersHorizontal },
];

function fmtLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDateRange(period, customStartDate, customEndDate) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start, end;

  switch (period) {
    case 'today':
      start = today;
      end = today;
      break;
    case 'yesterday':
      start = new Date(today.getTime() - 86400000);
      end = start;
      break;
    case 'lastWeek':
      start = new Date(today.getTime() - 7 * 86400000);
      end = today;
      break;
    case 'lastMonth':
      start = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      end = today;
      break;
    case 'custom':
      start = customStartDate ? new Date(customStartDate) : today;
      end = customEndDate ? new Date(customEndDate) : today;
      break;
    default:
      start = today;
      end = today;
  }

  return { startDate: fmtLocal(start), endDate: fmtLocal(end) };
}

function ItemList({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-1 pl-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-paper">
          <span className="font-item-title text-item-title text-on-surface min-w-0 flex-1 truncate">{item.name}</span>
          <span className="font-caption text-caption text-on-surface-variant min-w-[30px] text-right mr-3">x{item.quantity}</span>
          <span className="font-item-title text-item-title text-on-surface min-w-[70px] text-right">{formatCurrency(item.subtotal)}</span>
        </div>
      ))}
    </div>
  );
}

function WalkInOrderRow({ order }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-outline-variant/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 bg-paper hover:bg-surface transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronRight size={16} strokeWidth={1.8} className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
          <ShoppingCart size={16} strokeWidth={1.8} className="text-on-surface-variant" />
          <span className="font-item-title text-item-title text-on-surface truncate">
            {order.receiptNumber || 'Walk-in Order'}
          </span>
          {order.customerName && (
            <span className="font-caption text-caption text-on-surface-variant hidden sm:inline">— {order.customerName}</span>
          )}
        </div>
        <span className="font-item-title text-item-title text-on-surface shrink-0">{formatCurrency(order.totalAmount)}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 bg-surface border-t border-outline-variant/5">
          <ItemList items={order.items} />
        </div>
      )}
    </div>
  );
}

function SessionOrderRow({ order }) {
  const [open, setOpen] = useState(false);

  const label = order.tableNumber
    ? `Table ${String(order.tableNumber).padStart(2, '0')} — ${order.customerName}`
    : order.customerName;

  return (
    <div className="rounded-xl border border-outline-variant/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 bg-paper hover:bg-surface transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronRight size={16} strokeWidth={1.8} className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
          <CircleDot size={16} strokeWidth={1.8} className="text-data" />
          <span className="font-item-title text-item-title text-on-surface truncate">{label}</span>
        </div>
        <span className="font-item-title text-item-title text-on-surface shrink-0">{formatCurrency(order.cafeCharges)}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 bg-surface border-t border-outline-variant/5">
          <ItemList items={order.items} />
        </div>
      )}
    </div>
  );
}

function DayBreakdown({ day, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const hasWalkIn = day.walkInOrders && day.walkInOrders.length > 0;
  const hasSession = day.sessionOrders && day.sessionOrders.length > 0;

  return (
    <div className="rounded-[18px] border border-outline-variant/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-4 py-3.5 bg-paper hover:bg-surface transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <ChevronRight size={18} strokeWidth={1.8} className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
          <div className="text-left min-w-0">
            <p className="font-item-title text-item-title text-on-surface">{formatDate(day.date)}</p>
            <p className="font-caption text-caption text-on-surface-variant">
              {day.orderCount} order{day.orderCount !== 1 ? 's' : ''}
              {hasWalkIn && hasSession ? ' (walk-in + session)' : hasWalkIn ? ' (walk-in)' : hasSession ? ' (session)' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="font-caption text-caption text-on-surface-variant hidden sm:block">
            Walk-in: {formatCurrency(day.walkInRevenue)}
          </span>
          <span className="font-caption text-caption text-on-surface-variant hidden sm:block">
            Session: {formatCurrency(day.sessionCafeRevenue)}
          </span>
          <span className="font-item-title text-item-title text-on-surface min-w-[80px] text-right">
            {formatCurrency(day.totalRevenue)}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 bg-surface border-t border-outline-variant/10 space-y-4">
          {/* Walk-in Section */}
          {hasWalkIn && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={16} strokeWidth={1.8} className="text-on-surface-variant" />
                  <span className="font-caption text-on-surface-variant uppercase font-bold tracking-widest">Walk-in Sales</span>
                </div>
                <span className="font-item-title text-item-title text-on-surface">{formatCurrency(day.walkInRevenue)}</span>
              </div>
              <div className="space-y-1.5">
                {day.walkInOrders.map((order, i) => (
                  <WalkInOrderRow key={i} order={order} />
                ))}
              </div>
            </div>
          )}

          {/* Session Section */}
          {hasSession && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CircleDot size={16} strokeWidth={1.8} className="text-data" />
                  <span className="font-caption text-on-surface-variant uppercase font-bold tracking-widest">Session Cafe Sales</span>
                </div>
                <span className="font-item-title text-item-title text-on-surface">{formatCurrency(day.sessionCafeRevenue)}</span>
              </div>
              <div className="space-y-1.5">
                {day.sessionOrders.map((order, i) => (
                  <SessionOrderRow key={i} order={order} />
                ))}
              </div>
            </div>
          )}

          {!hasWalkIn && !hasSession && (
            <p className="font-caption text-caption text-on-surface-variant py-3 text-center">No sales recorded</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CafeSalesReportModal({ onClose }) {
  const [period, setPeriod] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  function showMessage(msg, type = 'success') {
    if (type === 'error') {
      setError(msg);
      return;
    }
    setToast(msg);
    clearTimeout(showMessage._t);
    showMessage._t = setTimeout(() => setToast(''), 3000);
  }

  async function handleGenerate() {
    if (period === 'custom' && (!customStartDate || !customEndDate)) {
      showMessage('Please select both start and end dates', 'error');
      return;
    }

    const { startDate, endDate } = getDateRange(period, customStartDate, customEndDate);
    setLoading(true);
    setError('');

    try {
      const res = await api.get('/reports/cafe-sales', { params: { startDate, endDate } });
      setReport(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell
      title="Cafe Sales Report"
      description="Select a period and generate a sales report."
      icon={BarChart3}
      onClose={onClose}
      maxWidth="max-w-4xl"
    >
      <Toast message={toast} type="success" />
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}

      {/* Period Selector */}
      <div className="bg-surface rounded-[18px] p-4 md:p-5 border border-outline-variant/10 mb-6">
        <h3 className="font-caption text-on-surface-variant uppercase font-bold tracking-widest mb-3">Select Period</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
          {PERIODS.map((p) => {
            const PIcon = p.Icon;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-item-title text-item-title transition-colors ${
                  period === p.value
                    ? 'bg-primary text-on-primary'
                    : 'bg-paper text-on-surface hover:bg-surface-container-high border border-outline-variant/20'
                }`}
              >
                <PIcon size={18} strokeWidth={1.8} />
                {p.label}
              </button>
            );
          })}
        </div>

        {period === 'custom' && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <label className="block">
              <span className="font-caption text-caption text-on-surface-variant mb-1 block">Start Date</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full rounded-xl bg-paper border border-outline-variant/20 px-3 py-2.5 font-body text-body text-on-surface focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="font-caption text-caption text-on-surface-variant mb-1 block">End Date</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full rounded-xl bg-paper border border-outline-variant/20 px-3 py-2.5 font-body text-body text-on-surface focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </label>
          </div>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="w-full sm:w-auto rounded-full bg-primary px-6 py-2.5 font-item-title text-item-title text-on-primary hover:bg-surface-tint transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} strokeWidth={1.8} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText size={18} strokeWidth={1.8} />
              Generate Report
            </>
          )}
        </button>
      </div>

      {/* Report Results */}
      {report && (
        <div className="space-y-6">
          {/* Report Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-title text-title text-on-surface">
              {fmtLocal(new Date(report.period.start)) === fmtLocal(new Date(report.period.end))
                ? formatDate(report.period.start)
                : `${formatDate(report.period.start)} — ${formatDate(report.period.end)}`}
            </h3>
            <span className="rounded-full bg-good-tint text-good px-3 py-1 font-caption text-caption">
              Report Ready
            </span>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <SummaryStat label="Walk-in Revenue" value={formatCurrency(report.summary.totalWalkInRevenue)} tone="neutral" />
            <SummaryStat label="Session Cafe" value={formatCurrency(report.summary.totalSessionCafeRevenue)} tone="data" />
            <SummaryStat label="Total Revenue" value={formatCurrency(report.summary.totalCafeRevenue)} tone="good" />
            <SummaryStat label="Total Orders" value={String(report.summary.totalOrders)} tone="neutral" />
            <SummaryStat label="Items Sold" value={String(report.summary.totalItemsSold)} tone="warn" />
          </div>

          {/* Product Breakdown */}
          {report.products.length > 0 && (
            <div className="bg-surface rounded-[24px] p-4 md:p-5">
              <h3 className="font-title text-title text-on-surface mb-4">Product Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="font-caption text-caption text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/10">
                      <th className="text-left py-3 pr-4">Product</th>
                      <th className="text-left py-3 pr-4 hidden sm:table-cell">Category</th>
                      <th className="text-right py-3 pr-4">Qty</th>
                      <th className="text-right py-3">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.products.map((product, i) => (
                      <tr key={i} className="border-b border-outline-variant/5 last:border-0">
                        <td className="py-3 pr-4">
                          <p className="font-item-title text-item-title text-on-surface">{product.name}</p>
                        </td>
                        <td className="py-3 pr-4 hidden sm:table-cell">
                          <span className="font-caption text-caption text-on-surface-variant">{product.category}</span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className="font-item-title text-item-title text-on-surface">{product.totalQuantity}</span>
                        </td>
                        <td className="py-3 text-right">
                          <span className="font-item-title text-item-title text-on-surface">{formatCurrency(product.totalRevenue)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-outline-variant/20 font-title text-title text-on-surface">
                <span>Total</span>
                <span>{formatCurrency(report.summary.totalCafeRevenue)}</span>
              </div>
            </div>
          )}

          {/* Daily Breakdown — always shown when data exists */}
          {report.dailyBreakdown.length > 0 && (
            <div className="bg-surface rounded-[24px] p-4 md:p-5">
              <h3 className="font-title text-title text-on-surface mb-4">
                {report.dailyBreakdown.length > 1 ? 'Daily Breakdown' : 'Sales Breakdown'}
              </h3>
              <div className="space-y-2">
                {report.dailyBreakdown.map((day, i) => (
                  <DayBreakdown key={day.date} day={day} defaultOpen={report.dailyBreakdown.length === 1} />
                ))}
              </div>
              {report.dailyBreakdown.length > 1 && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-outline-variant/20 font-title text-title text-on-surface">
                  <span>Total</span>
                  <span>{formatCurrency(report.summary.totalCafeRevenue)}</span>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {report.products.length === 0 && report.summary.totalCafeRevenue === 0 && (
            <div className="py-10 text-center bg-surface rounded-[20px] border border-outline-variant/20">
              <Package size={36} strokeWidth={1.5} className="text-on-surface-variant mx-auto mb-2" />
              <p className="font-item-title text-item-title text-on-surface">No sales found</p>
              <p className="font-body text-body text-on-surface-variant mt-1">No cafe sales recorded in this period.</p>
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
}
