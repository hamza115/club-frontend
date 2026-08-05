import { useState, useEffect } from 'react';
import { CreditCard, UtensilsCrossed, Coffee, Store, Utensils, CircleMinus, Tag, TrendingUp, ArrowLeftRight, Timer, CheckCircle2, Clock, Calendar, FileText, Folder, Receipt, CircleX, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { StatCard, SectionCard, DataTable, Badge, PKR, formatPercent } from './shared';

const SUMMARY_CARDS = [
  { key: 'totalRevenue', label: 'Total Revenue', icon: CreditCard, format: PKR },
  { key: 'totalTableRevenue', label: 'Table Revenue', icon: UtensilsCrossed, format: PKR },
  { key: 'totalSessionCafeRevenue', label: 'Session Cafe Revenue', icon: Coffee, format: PKR },
  { key: 'totalWalkInCafeRevenue', label: 'Walk-in Cafe Revenue', icon: Store, format: PKR },
  { key: 'totalCafeRevenue', label: 'Total Cafe Revenue', icon: Utensils, format: PKR },
  { key: 'totalExpenses', label: 'Total Expenses', icon: CircleMinus, format: PKR },
  { key: 'totalDiscounts', label: 'Total Discounts', icon: Tag, format: PKR },
  { key: 'netProfit', label: 'Net Profit', icon: TrendingUp, format: PKR },
  { key: 'totalPaymentsReceived', label: 'Payments Received', icon: CreditCard, format: PKR },
  { key: 'changeDue', label: 'Change Due', icon: ArrowLeftRight, format: PKR },
];

const SESSION_STAT_CARDS = [
  { key: 'total', label: 'Total Sessions', icon: Timer },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
  { key: 'avgValue', label: 'Avg Value', icon: TrendingUp, format: PKR },
];

const WALKIN_STAT_CARDS = [
  { key: 'count', label: 'Count', icon: Receipt },
  { key: 'revenue', label: 'Revenue', icon: CreditCard, format: PKR },
];

const PAYMENT_METHOD_COLUMNS = [
  { key: 'method', label: 'Method' },
  { key: 'amount', label: 'Amount', render: (r) => PKR(r.amount) },
];

const EXPENSE_CATEGORY_COLUMNS = [
  { key: 'category', label: 'Category' },
  { key: 'amount', label: 'Amount', render: (r) => PKR(r.amount) },
];

const PENDING_PAYMENT_COLUMNS = [
  { key: 'receiptNumber', label: 'Receipt #' },
  { key: 'customerName', label: 'Customer' },
  { key: 'finalAmount', label: 'Final Amount', render: (r) => PKR(r.finalAmount) },
  { key: 'amountPaid', label: 'Paid', render: (r) => PKR(r.amountPaid) },
  {
    key: 'outstanding',
    label: 'Outstanding',
    render: (r) => {
      const val = r.outstanding;
      return (
        <span className="flex items-center gap-2">
          {PKR(val)}
          {val > 0 && <Badge variant="danger">Due</Badge>}
        </span>
      );
    },
  },
];

export default function DailyClosingTab() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get('/reports/daily-closing', { params: { date } })
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load daily closing report'))
      .finally(() => setLoading(false));
  }, [date]);

  const summary = data?.summary || {};
  const sessionStats = data?.sessionStats || {};
  const walkInOrders = data?.walkInOrders || {};
  const pendingPayments = data?.pendingPayments || [];

  // Transform byPaymentMethod object into array for DataTable
  const paymentMethodRows = data
    ? Object.entries(data.byPaymentMethod || {}).map(([method, amount]) => ({ method, amount }))
    : [];

  // Transform expenseByCategory object into array for DataTable
  const expenseCategoryRows = data
    ? Object.entries(data.expenseByCategory || {}).map(([category, amount]) => ({ category, amount }))
    : [];

  const renderStatCard = (s, source) => {
    const raw = source?.[s.key];
    const display = loading ? '—' : s.format ? s.format(raw) : raw ?? '—';
    return <StatCard key={s.key} label={s.label} value={display} icon={s.icon} />;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Date picker */}
      <div className="flex items-center gap-3">
        <Calendar size={18} strokeWidth={1.8} className="text-on-surface-variant" />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-paper border border-outline-variant/30 rounded-lg px-3 py-1.5 font-caption text-caption text-on-surface focus:outline-none focus:border-primary"
        />
      </div>

      {error && (
        <div className="bg-alert-tint/20 text-alert font-body text-body rounded-xl p-4 flex items-center gap-2">
          <CircleX size={18} strokeWidth={1.8} />
          {error}
        </div>
      )}

      {/* End of Day Summary */}
      <SectionCard title="End of Day Summary" icon={FileText}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {SUMMARY_CARDS.map((s) => renderStatCard(s, summary))}
        </div>
      </SectionCard>

      {/* Session Stats */}
      <SectionCard title="Session Stats" icon={Timer}>
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {SESSION_STAT_CARDS.map((s) => renderStatCard(s, sessionStats))}
        </div>
      </SectionCard>

      {/* Walk-in Orders */}
      <SectionCard title="Walk-in Orders" icon={Store}>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {WALKIN_STAT_CARDS.map((s) => renderStatCard(s, walkInOrders))}
        </div>
      </SectionCard>

      {/* Payments by Method */}
      <SectionCard title="Payments by Method" icon={CreditCard}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable columns={PAYMENT_METHOD_COLUMNS} rows={paymentMethodRows} emptyText="No payment data for this day" />
        )}
      </SectionCard>

      {/* Expense by Category */}
      <SectionCard title="Expense by Category" icon={Folder}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable columns={EXPENSE_CATEGORY_COLUMNS} rows={expenseCategoryRows} emptyText="No expenses recorded for this day" />
        )}
      </SectionCard>

      {/* Pending Payments */}
      <SectionCard title="Pending Payments" icon={Clock}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable columns={PENDING_PAYMENT_COLUMNS} rows={pendingPayments} emptyText="No pending payments for this day" />
        )}
      </SectionCard>
    </div>
  );
}
