import { useState, useEffect } from 'react';
import api from '../lib/api';
import ModalShell from './ModalShell';
import { formatCurrency } from '../lib/currency';
import { useSettings } from '../context/SettingsContext';
import {
  User,
  Loader2,
  Phone,
  Mail,
  Clock,
  Calendar,
  StickyNote,
  History,
  CircleDot,
  TimerOff,
  Wallet,
  CreditCard,
  Banknote,
  CalendarCheck2,
  X,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function MetricTile({ label, value, icon: IconComponent, tone = 'neutral' }) {
  const tones = {
    good: 'bg-good-tint text-good',
    warn: 'bg-warn-tint text-warn',
    data: 'bg-data-tint text-data',
    neutral: 'bg-surface-container-high text-on-surface-variant',
    primary: 'bg-primary-tint text-primary',
  };

  return (
    <div className="rounded-[18px] bg-surface p-4 border border-outline-variant/10 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <IconComponent size={18} strokeWidth={1.8} className={tones[tone]?.split(' ')[1] || ''} />
        <span className="font-caption text-[11px] text-on-surface-variant uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-title text-[20px] md:text-title text-on-surface leading-tight">{value}</p>
    </div>
  );
}

function CollectPaymentModal({ customer, onClose, onCollected }) {
  const { currencyCode } = useSettings();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const outstanding = customer.outstandingBalance || 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post(`/customers/${customer._id}/collect-payment`, {
        amount: Number(amount),
        method,
        notes,
      });
      onCollected();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to collect payment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] bg-on-background/50 backdrop-blur-sm flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md bg-paper rounded-2xl border border-outline-variant/20 shadow-2xl p-5 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-good-tint text-good flex items-center justify-center">
              <DollarSign size={20} strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="font-item-title text-item-title text-on-surface">Collect Payment</h3>
              <p className="font-caption text-caption text-on-surface-variant">{customer.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-status-alert-tint text-status-alert rounded-xl font-caption text-caption">{error}</div>
        )}

        <div className="bg-warn-tint text-warn rounded-xl p-3 mb-4 flex items-center gap-2">
          <AlertTriangle size={18} strokeWidth={1.8} />
          <span className="font-caption text-caption font-semibold">Outstanding: {formatCurrency(outstanding)}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-caption text-caption font-semibold ml-1 text-on-surface">Amount ({currencyCode})</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); if (error) setError(''); }}
              className="w-full px-4 py-2.5 bg-surface-container-lowest border border-surface-variant rounded-lg focus:ring-2 focus:ring-primary text-body font-body"
              placeholder="0"
              min="0"
              max={outstanding}
              required
            />
            {outstanding > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(outstanding))}
                className="self-end font-caption text-primary hover:underline"
              >
                Pay full ({formatCurrency(outstanding)})
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-caption text-caption font-semibold ml-1 text-on-surface">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'cash', label: 'Cash' },
                { value: 'card', label: 'Card' },
                { value: 'bank_transfer', label: 'Transfer' },
                { value: 'mobile_wallet', label: 'JazzCash/EasyPaisa' },
              ].map((pm) => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setMethod(pm.value)}
                  className={`px-3 py-2.5 rounded-full font-item-title text-item-title transition-all ${
                    method === pm.value ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-caption text-caption font-semibold ml-1 text-on-surface">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-container-lowest border border-surface-variant rounded-lg focus:ring-2 focus:ring-primary text-body font-body"
              placeholder="Payment reference..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-full bg-surface text-on-surface hover:bg-surface-container-high transition-colors font-item-title text-item-title">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !amount || Number(amount) <= 0}
              className="flex-1 py-2.5 rounded-full bg-good text-on-primary hover:opacity-90 transition-colors font-item-title text-item-title disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} strokeWidth={1.8} />}
              {loading ? 'Collecting...' : 'Collect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WalletModal({ customer, type, onClose, onDone }) {
  const { currencyCode } = useSettings();
  const isCredit = type === 'credit';
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post(`/customers/${customer._id}/wallet`, {
        amount: Number(amount),
        type,
        notes,
      });
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update wallet');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] bg-on-background/50 backdrop-blur-sm flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md bg-paper rounded-2xl border border-outline-variant/20 shadow-2xl p-5 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isCredit ? 'bg-good-tint text-good' : 'bg-warn-tint text-warn'}`}>
              {isCredit ? <ArrowDownCircle size={20} strokeWidth={1.8} /> : <ArrowUpCircle size={20} strokeWidth={1.8} />}
            </div>
            <div>
              <h3 className="font-item-title text-item-title text-on-surface">
                {isCredit ? 'Add to Wallet' : 'Deduct from Wallet'}
              </h3>
              <p className="font-caption text-caption text-on-surface-variant">
                {customer.name} • Balance: {formatCurrency(customer.walletBalance)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-status-alert-tint text-status-alert rounded-xl font-caption text-caption">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-caption text-caption font-semibold ml-1 text-on-surface">Amount ({currencyCode})</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); if (error) setError(''); }}
              className="w-full px-4 py-2.5 bg-surface-container-lowest border border-surface-variant rounded-lg focus:ring-2 focus:ring-primary text-body font-body"
              placeholder="0"
              min="0"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-caption text-caption font-semibold ml-1 text-on-surface">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-container-lowest border border-surface-variant rounded-lg focus:ring-2 focus:ring-primary text-body font-body"
              placeholder={isCredit ? 'Top-up reference...' : 'Deduction reason...'}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-full bg-surface text-on-surface hover:bg-surface-container-high transition-colors font-item-title text-item-title">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !amount || Number(amount) <= 0}
              className={`flex-1 py-2.5 rounded-full font-item-title text-item-title disabled:opacity-50 flex items-center justify-center gap-2 transition-colors ${
                isCredit ? 'bg-good text-on-primary hover:opacity-90' : 'bg-warn text-on-primary hover:opacity-90'
              }`}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : (isCredit ? <ArrowDownCircle size={18} strokeWidth={1.8} /> : <ArrowUpCircle size={18} strokeWidth={1.8} />)}
              {loading ? 'Processing...' : isCredit ? 'Add to Wallet' : 'Deduct'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomerDetailModal({ customerId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCollectPayment, setShowCollectPayment] = useState(false);
  const [showWalletCredit, setShowWalletCredit] = useState(false);
  const [showWalletDebit, setShowWalletDebit] = useState(false);
  const [outstandingData, setOutstandingData] = useState(null);

  function fetchCustomer() {
    if (!customerId) return;
    setLoading(true);
    setError('');
    api.get(`/customers/${customerId}`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load customer'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  function fetchOutstanding() {
    if (!customerId) return;
    api.get(`/customers/${customerId}/outstanding`)
      .then((res) => setOutstandingData(res.data.data))
      .catch(() => setOutstandingData(null));
  }

  function handleActionDone() {
    setShowCollectPayment(false);
    setShowWalletCredit(false);
    setShowWalletDebit(false);
    setOutstandingData(null);
    fetchCustomer();
  }

  if (!customerId) return null;

  const customer = data?.customer;

  return (
    <ModalShell
      title="Customer Profile"
      icon={User}
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} strokeWidth={1.8} className="text-on-surface-variant animate-spin" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-status-alert-tint text-status-alert rounded-xl font-caption text-caption text-center">{error}</div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          {/* Profile Hero */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary-tint text-primary flex items-center justify-center shrink-0">
              <User size={32} strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-title text-title text-on-surface">{customer.name}</h3>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {customer.phone && (
                  <span className="flex items-center gap-1.5 font-caption text-caption text-on-surface-variant">
                    <Phone size={14} strokeWidth={1.8} />
                    {customer.phone}
                  </span>
                )}
                {customer.email && (
                  <span className="flex items-center gap-1.5 font-caption text-caption text-on-surface-variant">
                    <Mail size={14} strokeWidth={1.8} />
                    {customer.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricTile label="Total Visits" value={String(customer.visitCount || 0)} icon={CalendarCheck2} tone="data" />
            <MetricTile label="Lifetime Spent" value={formatCurrency(customer.lifetimeSpending)} icon={CreditCard} tone="good" />
            <MetricTile label="Outstanding (Udhaar)" value={formatCurrency(customer.outstandingBalance)} icon={Wallet} tone={customer.outstandingBalance > 0 ? 'warn' : 'neutral'} />
            <MetricTile label="Wallet (Khata)" value={formatCurrency(customer.walletBalance)} icon={Banknote} tone="primary" />
          </div>

          {/* Credit Limit */}
          {customer.creditLimit > 0 && (
            <div className="rounded-[18px] bg-surface p-4 border border-outline-variant/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-warn-tint text-warn flex items-center justify-center shrink-0">
                  <CreditCard size={18} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-caption text-[11px] text-on-surface-variant uppercase tracking-wider">Credit Limit</p>
                  <p className="font-item-title text-item-title text-on-surface">{formatCurrency(customer.creditLimit)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-caption text-[11px] text-on-surface-variant uppercase tracking-wider">Available</p>
                <p className={`font-item-title text-item-title ${customer.creditLimit - customer.outstandingBalance > 0 ? 'text-good' : 'text-warn'}`}>
                  {formatCurrency(Math.max(0, customer.creditLimit - customer.outstandingBalance))}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {customer.outstandingBalance > 0 && (
              <button
                onClick={() => { setShowCollectPayment(true); fetchOutstanding(); }}
                className="px-4 py-2.5 rounded-full bg-good-tint text-good hover:opacity-90 transition-colors font-item-title text-item-title flex items-center gap-2"
              >
                <DollarSign size={18} strokeWidth={1.8} />
                Collect Payment
              </button>
            )}
            <button
              onClick={() => setShowWalletCredit(true)}
              className="px-4 py-2.5 rounded-full bg-primary-tint text-primary hover:opacity-90 transition-colors font-item-title text-item-title flex items-center gap-2"
            >
              <ArrowDownCircle size={18} strokeWidth={1.8} />
              Add to Wallet
            </button>
            {customer.walletBalance > 0 && (
              <button
                onClick={() => setShowWalletDebit(true)}
                className="px-4 py-2.5 rounded-full bg-warn-tint text-warn hover:opacity-90 transition-colors font-item-title text-item-title flex items-center gap-2"
              >
                <ArrowUpCircle size={18} strokeWidth={1.8} />
                Deduct from Wallet
              </button>
            )}
          </div>

          {/* Outstanding Sessions */}
          {customer.outstandingBalance > 0 && outstandingData && outstandingData.sessions?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-item-title text-item-title text-on-surface">Outstanding Sessions</h4>
                <span className="font-caption text-caption text-warn font-semibold">
                  Total: {formatCurrency(outstandingData.totalOutstanding)}
                </span>
              </div>
              <div className="space-y-2">
                {outstandingData.sessions.map((session) => (
                  <div key={session._id} className="rounded-[18px] bg-surface border border-outline-variant/10 p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-warn-tint text-warn flex items-center justify-center shrink-0">
                        <CircleDot size={20} strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-item-title text-item-title text-on-surface">
                          Table {String(session.table?.tableNumber || '??').padStart(2, '0')}
                        </p>
                        <p className="font-caption text-caption text-on-surface-variant">{formatDateTime(session.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="rounded-full px-2.5 py-0.5 font-caption text-xs font-bold capitalize bg-warn-tint text-warn">
                        {session.paymentStatus}
                      </span>
                      <div className="text-right">
                        <p className="font-item-title text-item-title text-on-surface">{formatCurrency(session.finalAmount)}</p>
                        {session.amountPaid > 0 && (
                          <p className="font-caption text-caption text-good">Paid: {formatCurrency(session.amountPaid)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-[18px] bg-surface p-4 border border-outline-variant/10 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-data-tint text-data flex items-center justify-center shrink-0">
                <Clock size={18} strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-caption text-[11px] text-on-surface-variant uppercase tracking-wider">Last Visit</p>
                <p className="font-item-title text-item-title text-on-surface">{customer.lastVisit ? formatDate(customer.lastVisit) : 'No visits yet'}</p>
              </div>
            </div>
            <div className="rounded-[18px] bg-surface p-4 border border-outline-variant/10 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-good-tint text-good flex items-center justify-center shrink-0">
                <Calendar size={18} strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-caption text-[11px] text-on-surface-variant uppercase tracking-wider">Member Since</p>
                <p className="font-item-title text-item-title text-on-surface">{formatDate(customer.createdAt)}</p>
              </div>
            </div>
          </div>

          {customer.notes && (
            <div className="rounded-[18px] bg-surface p-4 border border-outline-variant/10">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote size={16} strokeWidth={1.8} className="text-on-surface-variant" />
                <span className="font-caption text-[11px] text-on-surface-variant uppercase tracking-wider">Notes</span>
              </div>
              <p className="font-body text-body text-on-surface">{customer.notes}</p>
            </div>
          )}

          {/* Visit History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History size={18} strokeWidth={1.8} className="text-on-surface-variant" />
                <h4 className="font-item-title text-item-title text-on-surface">Recent Visits</h4>
              </div>
              {data.recentVisits && data.recentVisits.length > 0 && (
                <span className="font-caption text-caption text-on-surface-variant">
                  {data.recentVisits.length} recent
                </span>
              )}
            </div>

            {data.recentVisits && data.recentVisits.length > 0 ? (
              <div className="space-y-2">
                {data.recentVisits.map((visit, idx) => {
                  const isActive = visit.paymentStatus === 'active';
                  const isPaid = visit.paymentStatus === 'paid';
                  const isPartial = visit.paymentStatus === 'partial';

                  return (
                    <div key={visit.groupId || idx} className="rounded-[18px] bg-surface border border-outline-variant/10 p-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-data-tint text-data' : isPaid ? 'bg-good-tint text-good' : 'bg-surface-container-high text-on-surface-variant'
                        }`}>
                          <CircleDot size={20} strokeWidth={1.8} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-item-title text-item-title text-on-surface">
                            Table {String(visit.table?.tableNumber || '??').padStart(2, '0')}
                            {visit.sessionCount > 1 && (
                              <span className="ml-1.5 font-caption text-xs text-on-surface-variant">({visit.sessionCount} sessions)</span>
                            )}
                          </p>
                          <p className="font-caption text-caption text-on-surface-variant">{formatDateTime(visit.startTime)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`rounded-full px-2.5 py-0.5 font-caption text-xs font-bold capitalize ${
                          isActive ? 'bg-data-tint text-data' :
                          isPaid ? 'bg-good-tint text-good' :
                          isPartial ? 'bg-warn-tint text-warn' :
                          'bg-warn-tint text-warn'
                        }`}>
                          {isActive ? 'Active' : isPaid ? 'Paid' : isPartial ? 'Partial' : 'Pending'}
                        </span>
                        <span className="font-item-title text-item-title text-on-surface">
                          {formatCurrency(visit.totalAmount)}
                        </span>
                        {visit.totalPaid > 0 && visit.totalPaid < visit.totalAmount && (
                          <span className="font-caption text-caption text-good">Paid: {formatCurrency(visit.totalPaid)}</span>
                        )}
                        {visit.leftover > 0 && (
                          <span className="font-caption text-caption text-warn font-semibold">Due: {formatCurrency(visit.leftover)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[18px] bg-surface border border-outline-variant/10 py-10 flex flex-col items-center justify-center">
                <TimerOff size={28} strokeWidth={1.5} className="text-on-surface-variant mb-2" />
                <p className="font-item-title text-item-title text-on-surface-variant">No visits yet</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Sub-modals */}
      {showCollectPayment && customer && (
        <CollectPaymentModal customer={customer} onClose={() => setShowCollectPayment(false)} onCollected={handleActionDone} />
      )}
      {showWalletCredit && customer && (
        <WalletModal customer={customer} type="credit" onClose={() => setShowWalletCredit(false)} onDone={handleActionDone} />
      )}
      {showWalletDebit && customer && (
        <WalletModal customer={customer} type="debit" onClose={() => setShowWalletDebit(false)} onDone={handleActionDone} />
      )}
    </ModalShell>
  );
}
