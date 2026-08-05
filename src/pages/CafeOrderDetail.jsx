import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import AppLayout from '../components/AppLayout';
import { formatCurrency } from '../lib/currency';
import { ArrowLeft, Loader2 } from 'lucide-react';

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function PaymentBadge({ method, status }) {
  const methodLabel = {
    cash: 'Cash',
    card: 'Card',
    bank_transfer: 'Transfer',
    mobile_wallet: 'Wallet',
  }[method] || method || 'Cash';

  return (
    <div className="flex flex-wrap gap-2">
      <span className="rounded-full bg-surface-container px-3 py-1.5 font-caption text-caption text-on-surface-variant">
        {methodLabel}
      </span>
      <span className={`rounded-full px-3 py-1.5 font-caption text-caption ${
        status === 'paid' ? 'bg-good-tint text-good' : status === 'partial' ? 'bg-warn-tint text-warn' : 'bg-alert-tint text-alert'
      }`}>
        {status || 'paid'}
      </span>
    </div>
  );
}

export default function CafeOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/cafe/orders/${id}`)
      .then((res) => {
        if (!cancelled) setOrder(res.data.data.order);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load order');
          setOrder(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const summary = useMemo(() => {
    if (!order) return null;
    return {
      items: order.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0,
      subtotal: order.items?.reduce((sum, item) => sum + Number(item.subtotal || 0), 0) || 0,
    };
  }, [order]);

  return (
    <AppLayout>
      <button
        onClick={() => navigate('/cafe')}
        className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-4 font-item-title text-item-title"
      >
        <ArrowLeft size={20} strokeWidth={1.8} />
        Back to Cafe
      </button>

      <div className="max-w-5xl mx-auto">
        <div className="mb-5 md:mb-6">
          <p className="font-caption text-[11px] md:text-caption text-on-surface-variant uppercase tracking-[0.22em]">
            Completed Order
          </p>
          <h2 className="font-headline text-[30px] md:text-[38px] xl:text-headline text-on-background leading-none mt-1">
            Order Details
          </h2>
          <p className="font-body text-[13px] md:text-body text-on-surface-variant mt-2">
            Review what was sold, how it was paid, and who completed the sale.
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 size={36} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : error ? (
          <div className="bg-paper rounded-[22px] border border-outline-variant/20 p-5">
            <p className="font-item-title text-item-title text-alert">{error}</p>
          </div>
        ) : order ? (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_360px] gap-4 md:gap-5">
            <section className="bg-surface rounded-[24px] p-4 md:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                <div>
                  <p className="font-caption text-caption text-on-surface-variant uppercase tracking-[0.2em]">
                    {order.saleMode === 'walk_in' ? 'Walk-in Sale' : 'Session Sale'}
                  </p>
                  <h3 className="font-title text-[20px] md:text-title text-on-surface mt-1">
                    {order.receiptNumber || 'Order'}
                  </h3>
                  <p className="font-body text-body text-on-surface-variant mt-1">
                    Created on {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <PaymentBadge method={order.paymentMethod} status={order.paymentStatus} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div className="rounded-[18px] bg-paper px-3 py-3">
                  <p className="font-caption text-caption text-on-surface-variant">Items</p>
                  <p className="font-title text-[20px] text-on-surface">{summary?.items || 0}</p>
                </div>
                <div className="rounded-[18px] bg-paper px-3 py-3">
                  <p className="font-caption text-caption text-on-surface-variant">Subtotal</p>
                  <p className="font-title text-[20px] text-on-surface">{formatCurrency(summary?.subtotal || 0)}</p>
                </div>
                <div className="rounded-[18px] bg-paper px-3 py-3">
                  <p className="font-caption text-caption text-on-surface-variant">Discount</p>
                  <p className="font-title text-[20px] text-on-surface">{formatCurrency(order.discount || 0)}</p>
                </div>
                <div className="rounded-[18px] bg-paper px-3 py-3">
                  <p className="font-caption text-caption text-on-surface-variant">Total</p>
                  <p className="font-title text-[20px] text-on-surface">{formatCurrency(order.totalAmount)}</p>
                </div>
              </div>

              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item._id || `${item.product?._id}-${item.name}`} className="bg-paper rounded-[18px] p-4 border border-outline-variant/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-item-title text-item-title text-on-surface truncate">{item.name}</p>
                        <p className="font-caption text-caption text-on-surface-variant truncate">
                          {item.product?.category || 'Cafe item'}
                        </p>
                      </div>
                      <p className="font-item-title text-item-title text-on-surface">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-3 text-caption text-on-surface-variant">
                      <span>Qty: {item.quantity}</span>
                      <span>Price: {formatCurrency(item.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="space-y-4">
              <section className="bg-surface rounded-[24px] p-4 md:p-5">
                <h3 className="font-title text-[20px] md:text-title text-on-surface">Order Info</h3>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-body text-body text-on-surface-variant">Done by</span>
                    <span className="font-item-title text-item-title text-on-surface">{order.createdBy?.name || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-body text-body text-on-surface-variant">Customer</span>
                    <span className="font-item-title text-item-title text-on-surface">{order.customerName || 'Walk-in'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-body text-body text-on-surface-variant">Receipt</span>
                    <span className="font-item-title text-item-title text-on-surface">{order.receiptNumber}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-body text-body text-on-surface-variant">Notes</span>
                    <span className="font-item-title text-item-title text-on-surface text-right">{order.notes || '—'}</span>
                  </div>
                </div>
              </section>

              <section className="bg-surface rounded-[24px] p-4 md:p-5">
                <h3 className="font-title text-[20px] md:text-title text-on-surface">Payment</h3>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-body text-body text-on-surface-variant">Method</span>
                    <span className="font-item-title text-item-title text-on-surface capitalize">
                      {String(order.paymentMethod || 'cash').replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-body text-body text-on-surface-variant">Amount Paid</span>
                    <span className="font-item-title text-item-title text-on-surface">{formatCurrency(order.amountPaid || order.totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-body text-body text-on-surface-variant">Status</span>
                    <span className="font-item-title text-item-title text-on-surface capitalize">{order.paymentStatus || 'paid'}</span>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
