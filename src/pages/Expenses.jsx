import { useState, useEffect, useCallback } from 'react';
import {
  Home, Zap, Droplets, Wifi, Badge, ShoppingCart, Wrench,
  Hammer, SprayCan, Megaphone, Fuel, Folder, Receipt, MoreHorizontal,
  Plus, CalendarDays, CalendarRange, Calendar, CalendarClock, CheckCircle2, Clock,
  CreditCard, PieChart, Search, ChevronLeft, ChevronRight, Eye, Pencil, Trash2,
  Repeat, Lock, Loader2, X
} from 'lucide-react';
import api from '../lib/api';
import AppLayout from '../components/AppLayout';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import ExpenseModal from '../components/ExpenseModal';
import ExpenseDetailModal from '../components/ExpenseDetailModal';
import { useAuth } from '../context/useAuth';
import { formatCurrency } from '../lib/currency';

const CATEGORIES = [
  'rent', 'electricity', 'water', 'internet', 'salaries', 'purchases',
  'repairs', 'maintenance', 'cleaning', 'marketing', 'fuel',
  'office_supplies', 'taxes', 'miscellaneous',
];

const CATEGORY_ICONS = {
  rent: Home, electricity: Zap, water: Droplets, internet: Wifi,
  salaries: Badge, purchases: ShoppingCart, repairs: Wrench,
  maintenance: Hammer, cleaning: SprayCan, marketing: Megaphone,
  fuel: Fuel, office_supplies: Folder, taxes: Receipt,
  miscellaneous: MoreHorizontal,
};

const CATEGORY_LABELS = {
  rent: 'Rent', electricity: 'Electricity', water: 'Water', internet: 'Internet',
  salaries: 'Salaries', purchases: 'Purchases', repairs: 'Repairs',
  maintenance: 'Maintenance', cleaning: 'Cleaning', marketing: 'Marketing',
  fuel: 'Fuel', office_supplies: 'Office Supplies', taxes: 'Taxes',
  miscellaneous: 'Miscellaneous',
};

const PAYMENT_METHOD_LABELS = {
  cash: 'Cash', card: 'Card', bank_transfer: 'Bank Transfer', mobile_wallet: 'Mobile Wallet',
};

const STATUS_STYLES = {
  pending: { bg: 'bg-warn-tint', text: 'text-warn', label: 'Pending' },
  approved: { bg: 'bg-good-tint', text: 'text-good', label: 'Approved' },
  rejected: { bg: 'bg-alert-tint', text: 'text-alert', label: 'Rejected' },
};

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

const TREND_PERIODS = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function SummaryCard({ label, value, icon: IconComponent, accent, note }) {
  return (
    <div className="bg-paper rounded-2xl p-4 md:p-5 border border-outline-variant/20 flex flex-col justify-between min-h-[110px] md:min-h-[130px]">
      <div className="flex items-start justify-between gap-2">
        <div className={`h-9 w-9 md:h-10 md:w-10 rounded-xl flex items-center justify-center shrink-0 ${accent?.bg || 'bg-surface-container'}`}>
          <IconComponent size={20} strokeWidth={1.8} className={accent?.text || 'text-on-surface-variant'} />
        </div>
        {note && (
          <span className={`px-2 py-0.5 rounded-full font-caption text-[10px] md:text-[11px] whitespace-nowrap ${accent?.pill || 'bg-surface-container text-on-surface-variant'}`}>
            {note}
          </span>
        )}
      </div>
      <div className="mt-3 md:mt-4">
        <p className="font-caption text-[11px] md:text-caption text-on-surface-variant mb-0.5">{label}</p>
        <p className="font-item-title text-[16px] md:text-title text-on-background leading-tight truncate">{value}</p>
      </div>
    </div>
  );
}

export default function Expenses() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const isAdmin = user?.role === 'super_admin';

  if (!isAdmin && !isManager) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Lock size={32} strokeWidth={1.5} className="text-on-surface-variant mb-4" />
          <h2 className="font-title text-title text-on-surface mb-2">Access Restricted</h2>
          <p className="font-body text-body text-on-surface-variant">You do not have permission to view this page.</p>
        </div>
      </AppLayout>
    );
  }
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [trendPeriod, setTrendPeriod] = useState(7);
  const [toast, setToast] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [viewExpense, setViewExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const limit = 10;

  const fetchExpenses = useCallback(() => {
    const params = { page, limit };
    if (search) params.search = search;
    if (categoryFilter) params.category = categoryFilter;
    if (statusFilter) params.status = statusFilter;

    api.get('/expenses', { params })
      .then((res) => {
        setExpenses(res.data.data || []);
        setTotal(res.data.meta?.total || 0);
      })
      .catch(() => setExpenses([]))
      .finally(() => setLoading(false));
  }, [page, search, categoryFilter, statusFilter]);

  const fetchSummary = useCallback(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const formatD = (d) => d.toISOString().slice(0, 10);
    const todayStr = formatD(today);

    api.get('/expenses', { params: { limit: 9999, status: 'approved' } })
      .then((res) => {
        const all = res.data.data || [];
        const todayExp = all.filter((e) => new Date(e.date).toISOString().slice(0, 10) === todayStr);
        const weekExp = all.filter((e) => new Date(e.date) >= startOfWeek);
        const monthExp = all.filter((e) => new Date(e.date) >= startOfMonth);
        const yearExp = all.filter((e) => new Date(e.date) >= startOfYear);

        setSummary({
          today: todayExp.reduce((s, e) => s + e.amount, 0),
          weekly: weekExp.reduce((s, e) => s + e.amount, 0),
          monthly: monthExp.reduce((s, e) => s + e.amount, 0),
          yearly: yearExp.reduce((s, e) => s + e.amount, 0),
          totalApproved: all.reduce((s, e) => s + e.amount, 0),
        });

        const catMap = {};
        for (const e of monthExp) {
          catMap[e.category] = (catMap[e.category] || 0) + e.amount;
        }
        const monthTotal = monthExp.reduce((s, e) => s + e.amount, 0) || 1;
        const breakdown = Object.entries(catMap)
          .map(([cat, amount]) => ({ category: cat, amount, percent: Math.round((amount / monthTotal) * 100) }))
          .sort((a, b) => b.amount - a.amount);
        setCategoryBreakdown(breakdown);
      })
      .catch(() => {});

    api.get('/expenses', { params: { limit: 9999, status: 'pending' } })
      .then((res) => {
        setSummary((prev) => ({ ...prev, pending: (res.data.data || []).length }));
      })
      .catch(() => {});
  }, []);

  const fetchTrend = useCallback(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - trendPeriod + 1);
    start.setHours(0, 0, 0, 0);

    api.get('/expenses', { params: { limit: 9999, status: 'approved', date_from: start.toISOString().slice(0, 10), date_to: end.toISOString().slice(0, 10) } })
      .then((res) => {
        const all = res.data.data || [];
        const dayMap = {};
        for (let i = 0; i < trendPeriod; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          dayMap[d.toISOString().slice(0, 10)] = 0;
        }
        for (const e of all) {
          const key = new Date(e.date).toISOString().slice(0, 10);
          if (key in dayMap) dayMap[key] += e.amount;
        }
        setTrend(Object.entries(dayMap).map(([date, amount]) => ({ date, amount })));
      })
      .catch(() => setTrend([]));
  }, [trendPeriod]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { fetchSummary(); fetchTrend(); }, [fetchSummary, fetchTrend]);

  useEffect(() => { setPage(1); }, [search, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(total / limit);

  function handleSaved(msg) {
    setShowAddModal(false);
    setEditExpense(null);
    setViewExpense(null);
    fetchExpenses();
    fetchSummary();
    fetchTrend();
    setToast(msg);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/expenses/${deleteTarget._id}`);
      setDeleteTarget(null);
      fetchExpenses();
      fetchSummary();
      fetchTrend();
      setToast('Expense deleted');
    } catch {
      setToast('Failed to delete expense');
    } finally {
      setDeleting(false);
    }
  }

  const maxTrend = Math.max(...trend.map((d) => d.amount), 1);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function formatTrendLabel(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((today - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return dayLabels[d.getDay()];
  }

  const BREAKDOWN_COLORS = [
    'bg-primary', 'bg-data', 'bg-good', 'bg-warn', 'bg-alert',
    'bg-secondary', 'bg-outline', 'bg-ink-tertiary',
  ];

  return (
    <AppLayout>
      <Toast message={toast} type="success" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="font-headline text-headline-mobile md:text-headline text-on-background">Expenses</h2>
          <p className="font-body text-body text-on-surface-variant mt-1">Track and manage business expenses</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-item-title text-item-title hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0"
        >
          <Plus size={20} strokeWidth={1.8} /> New Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 mb-8">
        <SummaryCard
          label="Today"
          value={formatCurrency(summary?.today ?? 0)}
          icon={CalendarDays}
          accent={{ bg: 'bg-surface-variant/30', text: 'text-on-surface-variant' }}
        />
        <SummaryCard
          label="This Week"
          value={formatCurrency(summary?.weekly ?? 0)}
          icon={CalendarRange}
          accent={{ bg: 'bg-data-tint', text: 'text-data' }}
        />
        <SummaryCard
          label="This Month"
          value={formatCurrency(summary?.monthly ?? 0)}
          icon={Calendar}
          accent={{ bg: 'bg-good-tint', text: 'text-good' }}
        />
        <SummaryCard
          label="This Year"
          value={formatCurrency(summary?.yearly ?? 0)}
          icon={CalendarClock}
          accent={{ bg: 'bg-warn-tint', text: 'text-warn' }}
        />
        <SummaryCard
          label="Total Approved"
          value={formatCurrency(summary?.totalApproved ?? 0)}
          icon={CheckCircle2}
          accent={{ bg: 'bg-good-tint', text: 'text-good' }}
        />
        <SummaryCard
          label="Pending"
          value={summary?.pending ?? 0}
          icon={Clock}
          accent={{ bg: 'bg-warn-tint', text: 'text-warn' }}
          note={summary?.pending > 0 ? 'Needs review' : undefined}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        {/* Spending Trends */}
        <div className="lg:col-span-2 bg-surface rounded-[18px] md:rounded-[24px] p-4 md:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-item-title text-item-title text-on-surface">Spending Trends</h2>
            <div className="flex gap-1 bg-paper p-1 rounded-lg border border-outline-variant/30">
              {TREND_PERIODS.map((p) => (
                <button
                  key={p.days}
                  onClick={() => setTrendPeriod(p.days)}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                    trendPeriod === p.days ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-paper rounded-[18px] p-4 flex-1 min-h-[250px] flex flex-col">
            {trend.length === 0 ? (
              <div className="w-full flex items-center justify-center flex-1">
                <p className="font-body text-body text-on-surface-variant">No expense data yet</p>
              </div>
            ) : (
              <div className="w-full flex items-end justify-between gap-1.5 flex-1 pt-8">
                {trend.map((day, i) => {
                  const barMaxPx = 200;
                  const barPx = maxTrend > 0 ? Math.max((day.amount / maxTrend) * barMaxPx, 4) : 4;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <span className="font-caption text-[10px] text-on-surface-variant whitespace-nowrap">
                        {day.amount > 0 ? formatCurrency(day.amount) : ''}
                      </span>
                      <div
                        className="w-full rounded-t-md bg-data hover:brightness-110 transition-all"
                        style={{ height: `${barPx}px`, minHeight: '4px' }}
                      />
                      {trendPeriod <= 7 && (
                        <span className="font-caption text-[10px] text-on-surface-variant">{formatTrendLabel(day.date)}</span>
                      )}
                      {trendPeriod > 7 && trendPeriod <= 30 && (
                        <span className="font-caption text-[9px] text-on-surface-variant">{new Date(day.date + 'T00:00:00').getDate()}</span>
                      )}
                      {trendPeriod > 30 && i % 7 === 0 && (
                        <span className="font-caption text-[9px] text-on-surface-variant">{new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Category Split */}
        <div className="bg-surface rounded-[18px] md:rounded-[24px] p-4 md:p-6">
          <h2 className="font-item-title text-item-title text-on-surface mb-5">By Category</h2>
          {categoryBreakdown.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <PieChart size={32} strokeWidth={1.5} className="text-on-surface-variant mb-2" />
              <p className="font-body text-body text-on-surface-variant">No category data this month</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryBreakdown.slice(0, 6).map((item, i) => {
                const CatIcon = CATEGORY_ICONS[item.category] || Receipt;
                return (
                  <div key={item.category} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-on-surface flex items-center gap-1.5">
                        <CatIcon size={16} strokeWidth={1.8} className="text-on-surface-variant" />
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                      <span className="text-on-surface-variant">{item.percent}%</span>
                    </div>
                    <div className="w-full bg-paper h-2 rounded-full overflow-hidden">
                      <div className={`${BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length]} h-full rounded-full transition-all`} style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                );
              })}
              {categoryBreakdown.length > 6 && (
                <p className="font-caption text-caption text-on-surface-variant text-center mt-2">
                  +{categoryBreakdown.length - 6} more categories
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expense Ledger */}
      <div className="bg-surface rounded-[18px] md:rounded-[24px] overflow-hidden">
        {/* Ledger Header */}
        <div className="p-4 md:p-5 flex flex-col gap-3 bg-surface-container-low">
          <h2 className="font-item-title text-item-title text-on-surface">Expense Ledger</h2>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
            <div className="relative">
              <Search size={20} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search expenses..."
                className="pl-10 pr-4 py-2 bg-paper border border-outline-variant/30 rounded-lg text-sm w-full sm:w-52 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-paper border border-outline-variant/30 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <div className="flex gap-1 bg-paper p-1 rounded-lg border border-outline-variant/30">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                    statusFilter === f.value ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="text-caption text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/20">
                <th className="px-4 md:px-6 py-4 font-semibold">Category</th>
                <th className="px-4 md:px-6 py-4 font-semibold">Title</th>
                <th className="px-4 md:px-6 py-4 font-semibold hidden md:table-cell">Method</th>
                <th className="px-4 md:px-6 py-4 font-semibold">Date</th>
                <th className="px-4 md:px-6 py-4 font-semibold text-right">Amount</th>
                <th className="px-4 md:px-6 py-4 font-semibold">Status</th>
                <th className="px-4 md:px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="text-body divide-y divide-outline-variant/10">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Loader2 size={32} strokeWidth={1.5} className="animate-spin text-on-surface-variant mx-auto" />
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center">
                      <CreditCard size={32} strokeWidth={1.5} className="text-on-surface-variant mb-2" />
                      <p className="font-body text-body text-on-surface-variant">No expenses found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => {
                  const statusStyle = STATUS_STYLES[exp.status] || STATUS_STYLES.pending;
                  const CatIcon = CATEGORY_ICONS[exp.category] || Receipt;
                  return (
                    <tr key={exp._id} className="bg-paper hover:bg-surface-container-lowest transition-colors">
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-data-tint text-data rounded-lg">
                            <CatIcon size={20} strokeWidth={1.8} />
                          </div>
                          <span className="font-item-title text-item-title text-on-surface">{CATEGORY_LABELS[exp.category] || exp.category}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <p className="font-item-title text-item-title text-on-surface truncate max-w-[160px]">{exp.title}</p>
                        {exp.vendor && <p className="font-caption text-[11px] text-on-surface-variant truncate max-w-[160px]">{exp.vendor}</p>}
                      </td>
                      <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                        <span className="bg-surface-container-low px-2 py-1 rounded text-xs font-caption">{PAYMENT_METHOD_LABELS[exp.paymentMethod] || exp.paymentMethod}</span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-on-surface-variant font-caption text-caption">{formatDate(exp.date)}</td>
                      <td className="px-4 md:px-6 py-4 font-item-title text-item-title text-on-surface text-right">{formatCurrency(exp.amount)}</td>
                      <td className="px-4 md:px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-caption text-[11px] ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                        {exp.isRecurring && (
                          <span className="ml-1 inline-flex items-center rounded-full px-2 py-0.5 bg-data-tint text-data font-caption text-[10px]">
                            <Repeat size={16} strokeWidth={1.8} className="mr-0.5" />
                            {exp.recurrenceFrequency}
                          </span>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewExpense(exp)}
                            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye size={20} strokeWidth={1.8} />
                          </button>
                          <button
                            onClick={() => setEditExpense(exp)}
                            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={20} strokeWidth={1.8} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(exp)}
                            className="p-1.5 text-on-surface-variant hover:text-alert hover:bg-alert-tint rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={20} strokeWidth={1.8} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 md:p-6 border-t border-outline-variant/20 flex flex-col sm:flex-row justify-between items-center gap-3 bg-surface">
            <p className="font-caption text-caption text-on-surface-variant">
              Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total} entries
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-paper transition-all disabled:opacity-40"
              >
                <ChevronLeft size={20} strokeWidth={1.8} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg border text-sm font-semibold transition-all ${
                      page === pageNum
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-outline-variant/30 text-on-surface-variant hover:bg-paper'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-paper transition-all disabled:opacity-40"
              >
                <ChevronRight size={20} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <ExpenseModal onClose={() => setShowAddModal(false)} onSaved={(msg) => handleSaved(msg)} />
      )}
      {editExpense && (
        <ExpenseModal expense={editExpense} onClose={() => setEditExpense(null)} onSaved={(msg) => handleSaved(msg)} />
      )}
      {viewExpense && (
        <ExpenseDetailModal
          expense={viewExpense}
          onClose={() => setViewExpense(null)}
          onEdit={(exp) => { setViewExpense(null); setEditExpense(exp); }}
          onStatusChange={() => { setViewExpense(null); fetchExpenses(); fetchSummary(); fetchTrend(); setToast('Status updated'); }}
          onDelete={(exp) => { setViewExpense(null); setDeleteTarget(exp); }}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Expense"
          description={`Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          icon={Trash2}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </AppLayout>
  );
}
