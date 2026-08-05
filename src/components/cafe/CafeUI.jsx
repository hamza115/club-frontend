import { Plus, Coffee, X, Minus } from 'lucide-react';
import { formatCurrency } from '../../lib/currency';

export function CafeSection({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`bg-surface rounded-[24px] p-4 md:p-5 ${className}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-title text-[20px] md:text-title text-on-surface">{title}</h3>
          {subtitle ? <p className="font-body text-[13px] md:text-body text-on-surface-variant mt-1">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function FilterPill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 font-item-title text-[13px] md:text-item-title transition-colors ${
        active ? 'bg-primary text-on-primary' : 'bg-paper text-on-surface hover:bg-surface-container-high'
      }`}
    >
      {children}
    </button>
  );
}

export function ProductCard({ product, onAdd, disabled }) {
  const stock = Number(product.stockQuantity || 0);
  const threshold = Number(product.minStockThreshold || 0);
  const lowStock = stock <= threshold && stock > 0;
  const ProductIcon = product.icon || Coffee;

  return (
    <div className="group bg-paper rounded-[22px] border border-outline-variant/20 hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="p-4">
        <div className="aspect-[4/3] rounded-2xl bg-surface flex items-center justify-center overflow-hidden">
          {product.image ? (
            <img src={product.image} alt={product.name} className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
          ) : (
            <div className="text-center">
              <ProductIcon size={34} strokeWidth={1.5} className="text-on-surface-variant mx-auto" />
            </div>
          )}
        </div>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-item-title text-item-title text-on-surface truncate">{product.name}</h4>
            <p className="font-caption text-caption text-on-surface-variant truncate">{product.category}</p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 font-caption text-[11px] ${
              !product.isAvailable
                ? 'bg-alert-tint text-alert'
                : lowStock
                  ? 'bg-warn-tint text-warn'
                  : 'bg-good-tint text-good'
            }`}
          >
            {!product.isAvailable ? 'Hidden' : lowStock ? 'Low stock' : `${stock} in stock`}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-caption text-caption text-on-surface-variant">Selling price</p>
            <p className="font-title text-[20px] md:text-[22px] text-on-surface leading-tight">
              {formatCurrency(product.sellingPrice)}
            </p>
          </div>
          <button
            type="button"
            onClick={onAdd}
            disabled={disabled || !product.isAvailable || stock <= 0}
            className="h-10 w-10 rounded-full bg-primary text-on-primary hover:bg-surface-tint transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            title="Add to cart"
          >
            <Plus size={20} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function CartRow({ item, onIncrement, onDecrement, onRemove }) {
  return (
    <div className="bg-paper rounded-[18px] p-3 border border-outline-variant/20">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-2xl bg-surface flex items-center justify-center shrink-0">
          <Coffee size={20} strokeWidth={1.8} className="text-on-surface-variant" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-item-title text-item-title text-on-surface truncate">{item.name}</p>
              <p className="font-caption text-caption text-on-surface-variant truncate">{item.category}</p>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="text-on-surface-variant hover:text-alert transition-colors"
              title="Remove"
            >
              <X size={18} strokeWidth={1.8} />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-caption text-caption text-on-surface-variant">Price</p>
              <p className="font-item-title text-item-title text-on-surface">
                {formatCurrency(item.price)}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-surface px-2 py-1">
              <button
                type="button"
                onClick={onDecrement}
                className="h-7 w-7 rounded-full text-on-surface-variant hover:bg-paper hover:text-on-surface transition-colors flex items-center justify-center"
              >
                <Minus size={16} strokeWidth={1.8} />
              </button>
              <span className="min-w-6 text-center font-item-title text-item-title text-on-surface">{item.quantity}</span>
              <button
                type="button"
                onClick={onIncrement}
                className="h-7 w-7 rounded-full text-on-surface-variant hover:bg-paper hover:text-on-surface transition-colors flex items-center justify-center"
              >
                <Plus size={16} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SummaryStat({ label, value, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-surface-container text-on-surface-variant',
    good: 'bg-good-tint text-good',
    warn: 'bg-warn-tint text-warn',
    data: 'bg-data-tint text-data',
  };

  return (
    <div className={`rounded-[18px] px-3 py-3 ${tones[tone]}`}>
      <p className="font-caption text-caption">{label}</p>
      <p className="font-title text-[20px] md:text-[22px] leading-tight">{value}</p>
    </div>
  );
}
