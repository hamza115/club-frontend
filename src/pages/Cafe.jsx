import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import AppLayout from '../components/AppLayout';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import { useAuth } from '../context/useAuth';
import { CafeSection, CartRow, FilterPill, ProductCard, SummaryStat } from '../components/cafe/CafeUI';
import CafeOrdersModal from '../components/cafe/CafeOrdersModal';
import CafeSalesReportModal from '../components/cafe/CafeSalesReportModal';
import { formatCurrency } from '../lib/currency';
import {
  CreditCard,
  Building2,
  Smartphone,
  BarChart3,
  Receipt,
  Loader2,
  Coffee,
  ShoppingCart,
} from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: 'payments' },
  { value: 'card', label: 'Card', icon: 'credit_card' },
  { value: 'bank_transfer', label: 'Transfer', icon: 'account_balance' },
  { value: 'mobile_wallet', label: 'Wallet', icon: 'phone_android' },
];

// Map payment method icons to Lucide components
const PAYMENT_LUCIDE_MAP = {
  payments: CreditCard,
  credit_card: CreditCard,
  account_balance: Building2,
  phone_android: Smartphone,
};

const CATEGORY_ICONS = {
  coffee: 'coffee',
  tea: 'emoji_food_beverage',
  drinks: 'local_bar',
  snacks: 'restaurant_menu',
  breakfast: 'breakfast_dining',
  pastry: 'bakery_dining',
  default: 'local_cafe',
};

function getCategoryIcon(category) {
  if (!category) return CATEGORY_ICONS.default;
  return CATEGORY_ICONS[category.toLowerCase().trim()] || CATEGORY_ICONS.default;
}

function SaleReceipt({ order }) {
  if (!order) return null;

  return (
    <div className="rounded-[22px] bg-surface-container-lowest border border-outline-variant/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-caption text-caption text-on-surface-variant uppercase tracking-[0.2em]">Last Sale</p>
          <h4 className="font-title text-[20px] text-on-surface mt-1">{order.receiptNumber || 'Receipt generated'}</h4>
        </div>
        <span className="rounded-full bg-good-tint text-good px-2.5 py-1 font-caption text-caption">Paid</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-2xl bg-surface px-3 py-2">
          <p className="font-caption text-caption text-on-surface-variant">Items</p>
          <p className="font-item-title text-item-title text-on-surface">{order.items?.length || 0}</p>
        </div>
        <div className="rounded-2xl bg-surface px-3 py-2">
          <p className="font-caption text-caption text-on-surface-variant">Total</p>
          <p className="font-item-title text-item-title text-on-surface">{formatCurrency(order.totalAmount)}</p>
        </div>
      </div>
      <p className="font-caption text-caption text-on-surface-variant mt-3">
        Recorded at {new Date(order.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
}

export default function Cafe() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showSalesReport, setShowSalesReport] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [lastOrder, setLastOrder] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/cafe/products?page=1&limit=100&isAvailable=true&sort=category:asc')
      .then((res) => {
        if (!cancelled) setProducts(res.data.data || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load cafe products');
          setProducts([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const unique = [...new Set(products.map((product) => product.category).filter(Boolean))];
    return unique.sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === 'all' || product.category === category;
      const matchesSearch =
        !query ||
        product.name?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [category, products, search]);

  const cartMap = useMemo(() => new Map(cart.map((item) => [item.productId, item])), [cart]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [cart],
  );
  const discountValue = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountValue);
  const itemCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const showMessage = (message, type = 'success') => {
    if (type === 'error') {
      setError(message);
      return;
    }
    setToast(message);
    window.clearTimeout(showMessage._timer);
    showMessage._timer = window.setTimeout(() => setToast(''), 3000);
  };

  const addToCart = (product) => {
    const current = cartMap.get(product._id);
    const currentQty = current?.quantity || 0;
    if (currentQty >= Number(product.stockQuantity || 0)) {
      showMessage('Not enough stock for this item', 'error');
      return;
    }

    setCart((prev) => {
      const index = prev.findIndex((item) => item.productId === product._id);
      if (index === -1) {
        return [
          ...prev,
          {
            productId: product._id,
            name: product.name,
            category: product.category,
            price: Number(product.sellingPrice || 0),
            quantity: 1,
            stockQuantity: Number(product.stockQuantity || 0),
          },
        ];
      }

      return prev.map((item, itemIndex) => (
        itemIndex === index ? { ...item, quantity: Math.min(item.quantity + 1, item.stockQuantity) } : item
      ));
    });
  };

  const incrementItem = (productId) => {
    setCart((prev) =>
      prev.map((item) => (
        item.productId === productId
          ? { ...item, quantity: Math.min(item.quantity + 1, item.stockQuantity) }
          : item
      )),
    );
  };

  const decrementItem = (productId) => {
    setCart((prev) =>
      prev
        .map((item) => (
          item.productId === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        ))
        .filter((item) => item.quantity > 0),
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscount('');
    setCustomerName('');
    setNotes('');
    setPaymentMethod('cash');
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showMessage('Add at least one product first', 'error');
      return;
    }

    setCheckoutLoading(true);
    setError('');
    try {
      const res = await api.post('/cafe/orders/walk-in', {
        items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        paymentMethod,
        customerName,
        discount: discountValue,
        notes,
      });

      const order = res.data.data.order;
      setLastOrder(order);
      clearCart();
      showMessage('Walk-in sale completed');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete cafe sale');
    } finally {
      setCheckoutLoading(false);
      setShowCheckoutConfirm(false);
    }
  };

  const recentBadges = [
    { label: `${products.length} products`, tone: 'neutral' },
    { label: `${categories.length} categories`, tone: 'data' },
    { label: `${itemCount} items in cart`, tone: cart.length ? 'good' : 'neutral' },
  ];

  return (
    <AppLayout>
      {showOrders && <CafeOrdersModal onClose={() => setShowOrders(false)} />}

      {showSalesReport && (
        <CafeSalesReportModal onClose={() => setShowSalesReport(false)} />
      )}

      {showCheckoutConfirm && (
        <ConfirmModal
          title="Complete Walk-in Sale"
          description={`Charge ${formatCurrency(total)} using ${PAYMENT_METHODS.find((method) => method.value === paymentMethod)?.label || 'Cash'}? This will record the sale and reduce inventory stock.`}
          confirmLabel="Complete Sale"
          confirmTone="primary"
          icon={CreditCard}
          loading={checkoutLoading}
          onClose={() => setShowCheckoutConfirm(false)}
          onConfirm={handleCheckout}
        />
      )}

      <Toast message={toast} type="success" />
      {error ? <Toast message={error} type="error" onClose={() => setError('')} /> : null}

      <div className="mb-5 md:mb-6">
        <p className="font-caption text-[11px] md:text-caption text-on-surface-variant uppercase tracking-[0.22em]">
          Cafe Point of Sale
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-1">
          <h2 className="font-headline text-[30px] md:text-[38px] xl:text-headline text-on-background leading-none">
            Cafe
          </h2>
          <span className="rounded-full bg-data-tint text-data px-2.5 py-1 font-caption text-caption">
            Walk-in mode
          </span>
        </div>
        <p className="font-body text-[13px] md:text-body text-on-surface-variant mt-2 max-w-2xl">
          Load menu items from Inventory, build a walk-in order, and complete payment immediately without creating a session.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 md:mb-5">
        {recentBadges.map((badge) => (
          <span
            key={badge.label}
            className={`rounded-full px-3 py-1.5 font-caption text-caption ${
              badge.tone === 'data'
                ? 'bg-data-tint text-data'
                : badge.tone === 'good'
                  ? 'bg-good-tint text-good'
                  : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            {badge.label}
          </span>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setShowSalesReport(true)}
          className="inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 font-item-title text-[13px] md:text-item-title text-on-surface hover:bg-surface-container-high transition-colors border border-outline-variant/20"
        >
          <BarChart3 size={18} strokeWidth={1.8} />
          Sales
        </button>

        <button
          type="button"
          onClick={() => setShowOrders(true)}
          className="inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 font-item-title text-[13px] md:text-item-title text-on-surface hover:bg-surface-container-high transition-colors border border-outline-variant/20"
        >
          <Receipt size={18} strokeWidth={1.8} />
          Completed Orders
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_360px] 2xl:grid-cols-[minmax(0,1.2fr)_380px] gap-4 md:gap-5">
        <div className="space-y-4 md:space-y-5">
          <CafeSection
            title="Menu"
            subtitle="Search products, filter by category, and add items directly from Inventory."
            action={
              <div className="hidden md:flex flex-col gap-2 min-w-[260px]">
                <div className="rounded-full bg-paper border border-outline-variant px-4 py-2">
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Quick search products..."
                    className="w-full bg-transparent border-0 p-0 font-body text-[13px] md:text-body text-on-surface placeholder:text-on-surface-variant/70 focus:ring-0"
                  />
                </div>
              </div>
            }
          >
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              <FilterPill active={category === 'all'} onClick={() => setCategory('all')}>
                All
              </FilterPill>
              {categories.map((item) => (
                <FilterPill key={item} active={category === item} onClick={() => setCategory(item)}>
                  {item}
                </FilterPill>
              ))}
            </div>

            <div className="md:hidden mb-4">
              <div className="rounded-full bg-paper border border-outline-variant px-4 py-2">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Quick search products..."
                  className="w-full bg-transparent border-0 p-0 font-body text-[13px] md:text-body text-on-surface placeholder:text-on-surface-variant/70 focus:ring-0"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <Loader2 size={32} strokeWidth={1.5} className="animate-spin text-on-surface-variant" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-14 text-center bg-paper rounded-[20px] border border-outline-variant/20">
                <div className="h-12 w-12 rounded-full bg-surface-container mx-auto flex items-center justify-center mb-3">
                  <Coffee size={20} strokeWidth={1.8} className="text-on-surface-variant" />
                </div>
                <p className="font-item-title text-item-title text-on-surface">No products found</p>
                <p className="font-body text-body text-on-surface-variant mt-1">
                  Try another search or category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={{ ...product, icon: getCategoryIcon(product.category) }}
                    onAdd={() => addToCart(product)}
                  />
                ))}
              </div>
            )}
          </CafeSection>
        </div>

        <div className="space-y-4 md:space-y-5">
          <CafeSection
            title="Current Order"
            subtitle="Payment is collected immediately for walk-in sales."
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <SummaryStat label="Subtotal" value={formatCurrency(subtotal)} tone="neutral" />
                <SummaryStat label="Discount" value={formatCurrency(discountValue)} tone="warn" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SummaryStat label="Items" value={String(itemCount)} tone="data" />
                <SummaryStat label="Total" value={formatCurrency(total)} tone="good" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="font-caption text-caption text-on-surface-variant mb-1 block">Customer name</span>
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  className="w-full rounded-input bg-surface-container-lowest border border-outline-variant px-4 py-2.5 font-body text-body text-on-surface focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="Optional"
                />
              </label>
              <label className="block">
                <span className="font-caption text-caption text-on-surface-variant mb-1 block">Discount</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                  className="w-full rounded-input bg-surface-container-lowest border border-outline-variant px-4 py-2.5 font-body text-body text-on-surface focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="0"
                />
              </label>
              <label className="block">
                <span className="font-caption text-caption text-on-surface-variant mb-1 block">Notes</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  className="w-full rounded-input bg-surface-container-lowest border border-outline-variant px-4 py-2.5 font-body text-body text-on-surface focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                  placeholder="Optional"
                />
              </label>
            </div>

            <div className="mt-5">
              <p className="font-caption text-caption text-on-surface-variant mb-2">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => {
                  const PaymentIcon = PAYMENT_LUCIDE_MAP[method.icon] || CreditCard;
                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentMethod(method.value)}
                      className={`rounded-full px-3 py-2.5 font-item-title text-[13px] md:text-item-title flex items-center justify-center gap-2 transition-colors ${
                        paymentMethod === method.value
                          ? 'bg-primary text-on-primary'
                          : 'bg-paper text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      <PaymentIcon size={18} strokeWidth={1.8} />
                      {method.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={clearCart}
                className="flex-1 rounded-full bg-surface px-4 py-3 font-item-title text-item-title text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setShowCheckoutConfirm(true)}
                disabled={cart.length === 0 || checkoutLoading}
                className="flex-[1.4] rounded-full bg-primary px-4 py-3 font-item-title text-item-title text-on-primary hover:bg-surface-tint transition-colors disabled:opacity-50"
              >
                {checkoutLoading ? 'Processing...' : 'Complete Sale'}
              </button>
            </div>
          </CafeSection>

          <CafeSection title={`Cart (${cart.length})`} subtitle="Adjust quantities before checkout.">
            {cart.length === 0 ? (
              <div className="py-10 text-center bg-paper rounded-[20px] border border-outline-variant/20">
                <ShoppingCart size={32} strokeWidth={1.5} className="mx-auto text-on-surface-variant" />
                <p className="font-item-title text-item-title text-on-surface mt-2">Cart is empty</p>
                <p className="font-body text-body text-on-surface-variant mt-1">Add products from the menu to start an order.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <CartRow
                    key={item.productId}
                    item={item}
                    onIncrement={() => incrementItem(item.productId)}
                    onDecrement={() => decrementItem(item.productId)}
                    onRemove={() => setCart((prev) => prev.filter((cartItem) => cartItem.productId !== item.productId))}
                  />
                ))}
              </div>
            )}
          </CafeSection>

          <SaleReceipt order={lastOrder} />
        </div>
      </div>
    </AppLayout>
  );
}
