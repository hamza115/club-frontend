import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/styles/overlayscrollbars.css';
import { formatCurrency } from '../../lib/currency';
import { X, Loader2, Receipt } from 'lucide-react';

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function PaymentChip({ method, status }) {
  const methodLabel = {
    cash: 'Cash',
    card: 'Card',
    bank_transfer: 'Transfer',
    mobile_wallet: 'Wallet',
  }[method] || method || 'Cash';

  return (
    <div className="flex flex-wrap gap-2">
      <span className="rounded-full bg-surface-container px-2.5 py-1 font-caption text-caption text-on-surface-variant">
        {methodLabel}
      </span>
      <span className={`rounded-full px-2.5 py-1 font-caption text-caption ${
        status === 'paid' ? 'bg-good-tint text-good' : status === 'partial' ? 'bg-warn-tint text-warn' : 'bg-alert-tint text-alert'
      }`}>
        {status || 'paid'}
      </span>
    </div>
  );
}

export default function CafeOrdersModal({ onClose }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get('/cafe/orders?limit=50&saleMode=walk_in')
      .then((res) => {
        if (!cancelled) setOrders(res.data.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load completed orders');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredOrders = orders.filter((order) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      order.receiptNumber?.toLowerCase().includes(query) ||
      order.customerName?.toLowerCase().includes(query) ||
      order.paymentMethod?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="fixed inset-0 z-[100] bg-on-background/45 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-4xl h-[92vh] sm:h-[86vh] bg-paper sm:rounded-[24px] shadow-2xl border border-outline-variant/20 flex flex-col overflow-hidden">
        <div className="px-4 md:px-5 py-4 border-b border-outline-variant/20 flex items-start justify-between gap-3">
          <div>
            <p className="font-caption text-caption uppercase tracking-[0.2em] text-on-surface-variant">Completed Orders</p>
            <h3 className="font-title text-[20px] md:text-title text-on-surface">Cafe Orders</h3>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>

        <div className="px-4 md:px-5 py-4 border-b border-outline-variant/20">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search receipt, customer, payment..."
            className="w-full rounded-full bg-surface-container-lowest border border-outline-variant px-4 py-2.5 font-body text-body text-on-surface focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        <OverlayScrollbarsComponent
          defer
          options={{
            scrollbars: { autoHide: 'leave', autoHideDelay: 300 },
            overflow: { x: 'hidden', y: 'scroll' },
          }}
          className="flex-1 p-4 md:p-5"
        >
          {loading ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 size={36} strokeWidth={1.8} className="text-on-surface-variant animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-alert-tint text-alert rounded-[18px] p-4 font-body text-body">
              {error}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center">
              <Receipt size={40} strokeWidth={1.5} className="text-on-surface-variant mx-auto mb-2" />
              <p className="font-item-title text-item-title text-on-surface mt-2">No completed orders</p>
              <p className="font-body text-body text-on-surface-variant mt-1">Completed walk-in sales will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
              {filteredOrders.map((order) => {
                const itemCount = order.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;

                return (
                  <button
                    key={order._id}
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/cafe/orders/${order._id}`);
                    }}
                    className="text-left bg-surface rounded-[20px] p-4 hover:shadow-md transition-shadow border border-outline-variant/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-item-title text-item-title text-on-surface truncate">
                          {order.receiptNumber || 'Receipt pending'}
                        </p>
                        <p className="font-caption text-caption text-on-surface-variant truncate">
                          {order.customerName || 'Walk-in customer'}
                        </p>
                      </div>
                      <span className="font-item-title text-item-title text-on-surface">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="font-caption text-caption text-on-surface-variant">
                        {itemCount} item{itemCount === 1 ? '' : 's'} • {formatDateTime(order.createdAt)}
                      </div>
                      <PaymentChip method={order.paymentMethod} status={order.paymentStatus} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </OverlayScrollbarsComponent>
      </div>
    </div>
  );
}
