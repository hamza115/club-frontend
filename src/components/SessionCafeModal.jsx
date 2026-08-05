import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import ModalShell from './ModalShell';
import { FilterPill, ProductCard, CartRow, SummaryStat } from './cafe/CafeUI';
import Toast from './Toast';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/styles/overlayscrollbars.css';
import { formatCurrency } from '../lib/currency';
import { Coffee, Loader2, ShoppingCart } from 'lucide-react';

export default function SessionCafeModal({ sessionId, onClose, onItemsAdded }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get('/cafe/products?page=1&limit=100&isAvailable=true&sort=category:asc')
      .then((res) => {
        if (!cancelled) setProducts(res.data.data || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load products');
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
    const unique = [...new Set(products.map((p) => p.category).filter(Boolean))];
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

      return prev.map((item, i) =>
        i === index ? { ...item, quantity: Math.min(item.quantity + 1, item.stockQuantity) } : item,
      );
    });
  };

  const incrementItem = (productId) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(item.quantity + 1, item.stockQuantity) }
          : item,
      ),
    );
  };

  const decrementItem = (productId) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  async function handleAddToSession() {
    if (cart.length === 0) {
      showMessage('Add at least one product first', 'error');
      return;
    }

    setAdding(true);
    setError('');
    try {
      await api.post(`/sessions/${sessionId}/cafe-items`, {
        items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      });

      showMessage('Items added to session');
      setCart([]);
      onItemsAdded?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add items to session');
    } finally {
      setAdding(false);
    }
  }

  return (
    <ModalShell
      title="Add Cafe Items"
      description="Select products from inventory to add to this session's bill."
      icon={Coffee}
      onClose={onClose}
      maxWidth="max-w-4xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <SummaryStat label="Items" value={String(itemCount)} tone="data" />
            <SummaryStat label="Total" value={formatCurrency(subtotal)} tone="good" />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-surface px-5 py-3 font-item-title text-item-title text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleAddToSession}
              disabled={cart.length === 0 || adding}
              className="rounded-full bg-primary px-5 py-3 font-item-title text-item-title text-on-primary hover:bg-surface-tint transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? 'Adding...' : 'Add to Session'}
            </button>
          </div>
        </div>
      }
    >
      <Toast message={toast} type="success" />
      {error ? <Toast message={error} type="error" onClose={() => setError('')} /> : null}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-5 min-h-0">
        {/* Product Grid */}
        <div className="flex flex-col min-h-0">
          <div className="mb-3 shrink-0">
            <div className="rounded-full bg-surface border border-outline-variant/20 px-4 py-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-transparent border-0 p-0 font-body text-body text-on-surface placeholder:text-on-surface-variant/70 focus:ring-0"
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 shrink-0">
            <FilterPill active={category === 'all'} onClick={() => setCategory('all')}>
              All
            </FilterPill>
            {categories.map((cat) => (
              <FilterPill key={cat} active={category === cat} onClick={() => setCategory(cat)}>
                {cat}
              </FilterPill>
            ))}
          </div>

          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 size={36} strokeWidth={1.8} className="text-on-surface-variant animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-14 text-center bg-surface rounded-[20px] border border-outline-variant/20">
              <Coffee size={36} strokeWidth={1.5} className="text-on-surface-variant mx-auto mb-2" />
              <p className="font-item-title text-item-title text-on-surface">No products found</p>
            </div>
          ) : (
            <OverlayScrollbarsComponent
              defer
              options={{ scrollbars: { autoHide: 'leave' }, overflow: { x: 'hidden', y: 'scroll' } }}
              className="flex-1 min-h-0 pr-1"
            >
              <div className="grid grid-cols-2 gap-3 pb-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAdd={() => addToCart(product)}
                  />
                ))}
              </div>
            </OverlayScrollbarsComponent>
          )}
        </div>

        {/* Cart */}
        <div className="flex flex-col min-h-0">
          <div className="bg-surface rounded-[18px] p-4 border border-outline-variant/10 flex flex-col min-h-0 flex-1">
            <h4 className="font-caption text-on-surface-variant uppercase font-bold tracking-widest mb-3 shrink-0">
              Cart ({cart.length})
            </h4>
            {cart.length === 0 ? (
              <div className="py-8 text-center">
                <ShoppingCart size={28} strokeWidth={1.5} className="text-on-surface-variant mx-auto mb-2" />
                <p className="font-caption text-caption text-on-surface-variant">Select products to add</p>
              </div>
            ) : (
              <OverlayScrollbarsComponent
                defer
                options={{ scrollbars: { autoHide: 'leave' }, overflow: { x: 'hidden', y: 'scroll' } }}
                className="space-y-2 flex-1 min-h-0"
              >
                {cart.map((item) => (
                  <CartRow
                    key={item.productId}
                    item={item}
                    onIncrement={() => incrementItem(item.productId)}
                    onDecrement={() => decrementItem(item.productId)}
                    onRemove={() => setCart((prev) => prev.filter((c) => c.productId !== item.productId))}
                  />
                ))}
              </OverlayScrollbarsComponent>
            )}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
