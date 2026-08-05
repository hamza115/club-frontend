import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import AppLayout from '../components/AppLayout';
import CustomerDetailModal from '../components/CustomerDetailModal';
import { formatCurrency } from '../lib/currency';
import {
  User,
  Eye,
  Search,
  X,
  Loader2,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelativeDate(dateStr) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return formatDate(dateStr);
}

function CustomerCard({ customer, onView }) {
  const hasOutstanding = customer.outstandingBalance > 0;
  const hasWallet = customer.walletBalance > 0;

  return (
    <div className="bg-paper rounded-[18px] border border-outline-variant/20 flex flex-col hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Top section */}
      <div className="p-4 md:p-5 flex items-start gap-3.5">
        <div className="h-12 w-12 rounded-2xl bg-primary-tint text-primary flex items-center justify-center shrink-0">
          <User size={24} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-item-title text-item-title text-on-surface truncate">{customer.name}</h3>
          {customer.phone && (
            <p className="font-caption text-caption text-on-surface-variant mt-0.5">{customer.phone}</p>
          )}
          <p className="font-caption text-caption text-on-surface-variant mt-1">
            Last visit: {formatRelativeDate(customer.lastVisit)}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 md:px-5 pb-4 md:pb-5">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-surface/60 p-3 text-center">
            <p className="font-caption text-[11px] text-on-surface-variant uppercase tracking-wider">Visits</p>
            <p className="font-item-title text-item-title text-on-surface mt-0.5">{customer.visitCount || 0}</p>
          </div>
          <div className="rounded-xl bg-surface/60 p-3 text-center">
            <p className="font-caption text-[11px] text-on-surface-variant uppercase tracking-wider">Spent</p>
            <p className="font-item-title text-item-title text-on-surface mt-0.5">{formatCurrency(customer.lifetimeSpending)}</p>
          </div>
          <div className="rounded-xl bg-surface/60 p-3 text-center">
            <p className="font-caption text-[11px] text-on-surface-variant uppercase tracking-wider">Due</p>
            <p className={`font-item-title text-item-title mt-0.5 ${hasOutstanding ? 'text-warn' : 'text-on-surface-variant'}`}>
              {hasOutstanding ? formatCurrency(customer.outstandingBalance) : 'Clear'}
            </p>
          </div>
          <div className="rounded-xl bg-surface/60 p-3 text-center">
            <p className="font-caption text-[11px] text-on-surface-variant uppercase tracking-wider">Wallet</p>
            <p className={`font-item-title text-item-title mt-0.5 ${hasWallet ? 'text-primary' : 'text-on-surface-variant'}`}>
              {formatCurrency(customer.walletBalance || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="px-4 md:px-5 py-3 border-t border-outline-variant/10">
        <button
          type="button"
          onClick={() => onView(customer._id)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface text-on-surface-variant hover:bg-primary-tint hover:text-primary font-item-title text-item-title transition-colors"
        >
          <Eye size={18} strokeWidth={1.8} />
          View Profile
        </button>
      </div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState(null);

  const limit = 20;

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/customers', { params });
      setCustomers(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      setCustomers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-title text-title text-on-surface">Customers</h1>
          <p className="font-body text-body text-on-surface-variant mt-1">
            {total} customer{total !== 1 ? 's' : ''} on record
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative bg-paper border border-outline-variant/20 rounded-2xl focus-within:border-primary focus-within:shadow-sm transition-all">
          <Search size={20} strokeWidth={1.8} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:ring-0 text-body font-body"
            placeholder="Search by name or phone..."
          />
          {search && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X size={20} strokeWidth={1.8} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-20 w-20 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
            <Users size={36} strokeWidth={1.5} className="text-on-surface-variant" />
          </div>
          <p className="font-item-title text-item-title text-on-surface mb-1">
            {search ? 'No customers found' : 'No customers yet'}
          </p>
          <p className="font-body text-body text-on-surface-variant">
            {search ? 'Try a different search term' : 'Customers will appear here when sessions are started'}
          </p>
        </div>
      ) : (
        <>
          {/* Customer Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {customers.map((customer) => (
              <CustomerCard key={customer._id} customer={customer} onView={setDetailId} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-outline-variant/10">
              <p className="font-caption text-caption text-on-surface-variant">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-9 px-4 rounded-xl bg-paper border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 font-item-title text-item-title"
                >
                  <ChevronLeft size={18} strokeWidth={1.8} />
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-9 px-4 rounded-xl bg-paper border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 font-item-title text-item-title"
                >
                  Next
                  <ChevronRight size={18} strokeWidth={1.8} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Customer Detail Modal */}
      {detailId && (
        <CustomerDetailModal customerId={detailId} onClose={() => setDetailId(null)} />
      )}
    </AppLayout>
  );
}
