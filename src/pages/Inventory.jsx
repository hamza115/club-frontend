import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../lib/api';
import AppLayout from '../components/AppLayout';
import ConfirmModal from '../components/ConfirmModal';
import FormInput from '../components/FormInput';
import ModalShell from '../components/ModalShell';
import Toast from '../components/Toast';
import { useAuth } from '../context/useAuth';
import { useSettings } from '../context/SettingsContext';
import {
  EmptyState,
  MetricCard,
  PanelCard,
  StatusBadge,
} from '../components/inventory/InventoryUI';
import {
  X,
  Coffee,
  Wine,
  UtensilsCrossed,
  CircleDot,
  Package,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  HeadsetIcon,
  Plus,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  RotateCcw,
  Loader2,
  CreditCard,
  Tag,
  AlertTriangle,
  UserPlus,
  Store,
  Phone,
  Contact,
  Wallet,
} from 'lucide-react';

const EMPTY_FORM = {
  name: '',
  category: '',
  purchasePrice: '',
  sellingPrice: '',
  stockQuantity: '0',
  minStockThreshold: '5',
  isAvailable: true,
};

const CATEGORY_ICONS = {
  beverage: 'local_cafe',
  drinks: 'local_bar',
  snack: 'restaurant_menu',
  snacks: 'restaurant_menu',
  equipment: 'sports_handball',
  supplies: 'inventory_2',
  default: 'inventory_2',
};

// Map material icon names to Lucide components for inline rendering
const CATEGORY_LUCIDE_MAP = {
  local_cafe: Coffee,
  local_bar: Wine,
  restaurant_menu: UtensilsCrossed,
  sports_handball: CircleDot,
  inventory_2: Package,
};

function CategoryIcon({ name, size = 20, strokeWidth = 1.8, className = '' }) {
  const LucideComp = CATEGORY_LUCIDE_MAP[name] || Package;
  return <LucideComp size={size} strokeWidth={strokeWidth} className={className} />;
}

// Map timeline movement icons to Lucide
const MOVEMENT_LUCIDE_MAP = {
  north_east: ArrowUpRight,
  sync: RefreshCw,
  south_east: ArrowDownRight,
  undo: RotateCcw,
  delete: Trash2,
};

function MovementIcon({ name, size = 14, strokeWidth = 1.8, className = '' }) {
  const LucideComp = MOVEMENT_LUCIDE_MAP[name] || RefreshCw;
  return <LucideComp size={size} strokeWidth={strokeWidth} className={className} />;
}

function quantityLabel(product) {
  const units = Number(product.stockQuantity || 0);
  return `${units} ${units === 1 ? 'unit' : 'units'}`;
}

function stockState(product) {
  if (!product.isAvailable) return { tone: 'neutral', label: 'Inactive' };
  if (Number(product.stockQuantity || 0) <= 0) return { tone: 'alert', label: 'Out of stock' };
  if (Number(product.stockQuantity || 0) <= Number(product.minStockThreshold || 0)) {
    return { tone: 'warn', label: 'Low stock' };
  }
  return { tone: 'success', label: 'In stock' };
}

function stockFill(product) {
  const stock = Number(product.stockQuantity || 0);
  const threshold = Math.max(Number(product.minStockThreshold || 1), 1);
  return Math.max(8, Math.min(100, Math.round((stock / (stock + threshold)) * 100)));
}

function categoryIcon(category) {
  if (!category) return CATEGORY_ICONS.default;
  const key = category.toLowerCase().trim();
  return CATEGORY_ICONS[key] || CATEGORY_ICONS.default;
}

function formatRelativeDate(dateString) {
  if (!dateString) return 'Recently';

  const created = new Date(dateString);
  const diffMs = Date.now() - created.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

function buildExportCsv(products) {
  const header = ['Name', 'Category', 'Stock', 'Reorder Level', 'Purchase Price', 'Selling Price', 'Status'];
  const rows = products.map((product) => [
    product.name,
    product.category,
    String(product.stockQuantity ?? 0),
    String(product.minStockThreshold ?? 0),
    String(product.purchasePrice ?? 0),
    String(product.sellingPrice ?? 0),
    product.isAvailable ? 'Active' : 'Inactive',
  ]);

  return [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

function InventoryForm({ value, onChange, categories }) {
  const update = (field) => (event) => {
    const nextValue = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    onChange({ ...value, [field]: nextValue });
  };

  return (
    <div className="space-y-4">
      <FormInput label="Item Name" icon={Package} value={value.name} onChange={update('name')} placeholder="Arabica Beans" />

      <div>
        <label className="block font-item-title text-item-title text-on-surface-variant mb-xs">Category</label>
        <input
          list="inventory-categories"
          value={value.category}
          onChange={update('category')}
          placeholder="Beverage"
          className="block w-full px-sm py-sm bg-surface-container-lowest border border-outline-variant rounded-input text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
        />
        <datalist id="inventory-categories">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput label="Purchase Price" icon={CreditCard} type="number" min="0" step="0.01" value={value.purchasePrice} onChange={update('purchasePrice')} />
        <FormInput label="Selling Price" icon={Tag} type="number" min="0" step="0.01" value={value.sellingPrice} onChange={update('sellingPrice')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput label="Current Stock" icon={Package} type="number" min="0" step="1" value={value.stockQuantity} onChange={update('stockQuantity')} />
        <FormInput label="Reorder Level" icon={AlertTriangle} type="number" min="0" step="1" value={value.minStockThreshold} onChange={update('minStockThreshold')} />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-[14px] bg-surface-container-lowest border border-outline-variant px-4 py-3">
        <div>
          <p className="font-item-title text-item-title text-on-surface">Available for sale</p>
          <p className="font-caption text-caption text-on-surface-variant">
            Toggle off to hide this item from the Cafe POS and keep it archived.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={value.isAvailable}
          onClick={() => onChange({ ...value, isAvailable: !value.isAvailable })}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
            value.isAvailable ? 'bg-good' : 'bg-surface-variant'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-paper shadow transition-transform ${
              value.isAvailable ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      {!value.isAvailable && (
        <p className="font-caption text-caption text-warn bg-warn-tint rounded-[12px] px-3 py-2">
          This product will stay in Inventory, but staff cannot sell it from the Cafe POS while it is turned off.
        </p>
      )}
    </div>
  );
}

function InventoryModal({ mode, product, categories, onClose, onSave, saving, error, onClearError }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!product) {
      setForm(EMPTY_FORM);
      return;
    }

    setForm({
      name: product.name || '',
      category: product.category || '',
      purchasePrice: String(product.purchasePrice ?? ''),
      sellingPrice: String(product.sellingPrice ?? ''),
      stockQuantity: String(product.stockQuantity ?? 0),
      minStockThreshold: String(product.minStockThreshold ?? 5),
      isAvailable: product.isAvailable ?? true,
    });
  }, [product]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      name: form.name.trim(),
      category: form.category.trim(),
      purchasePrice: Number(form.purchasePrice),
      sellingPrice: Number(form.sellingPrice),
      stockQuantity: Number(form.stockQuantity),
      minStockThreshold: Number(form.minStockThreshold),
      isAvailable: Boolean(form.isAvailable),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-on-background/45 backdrop-blur-sm flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-[24px] bg-paper border border-outline-variant/20 shadow-2xl p-5 md:p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="font-caption text-caption uppercase tracking-[0.22em] text-on-surface-variant">
              {mode === 'edit' ? 'Update item' : 'Create item'}
            </p>
            <h3 className="font-title text-title text-on-surface mt-1">
              {mode === 'edit' ? 'Edit Inventory Item' : 'Add Inventory Item'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>

        <Toast message={error} type="error" onClose={onClearError} />

        <form onSubmit={handleSubmit} className="space-y-5">
          <InventoryForm value={form} onChange={setForm} categories={categories} />
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full bg-surface px-5 py-2.5 font-item-title text-item-title text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-full bg-primary px-5 py-2.5 font-item-title text-item-title text-on-primary hover:bg-surface-tint transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InventoryRow({ product, isAdmin, onEdit, onDelete, currency }) {
  const state = stockState(product);
  const icon = categoryIcon(product.category);

  return (
    <tr className="bg-paper rounded-[18px] shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
      <td className="py-4 px-4 rounded-l-[18px]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-surface flex items-center justify-center shrink-0">
            <CategoryIcon name={icon} size={20} strokeWidth={1.8} className="text-on-surface-variant" />
          </div>
          <div className="min-w-0">
            <p className="font-item-title text-item-title text-on-surface truncate">{product.name}</p>
            <p className="font-caption text-caption text-on-surface-variant truncate">Category: {product.category}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-3 min-w-[180px]">
          <div className="h-1.5 w-24 rounded-full bg-surface-variant overflow-hidden">
            <div className={`h-full rounded-full ${state.tone === 'alert' ? 'bg-alert' : state.tone === 'warn' ? 'bg-warn' : state.tone === 'success' ? 'bg-good' : 'bg-surface-tint'}`} style={{ width: `${stockFill(product)}%` }} />
          </div>
          <span className={`font-item-title text-item-title ${state.tone === 'alert' ? 'text-alert' : state.tone === 'warn' ? 'text-warn' : 'text-on-surface'}`}>
            {quantityLabel(product)}
          </span>
        </div>
      </td>
      <td className="py-4 px-4 font-body text-body text-on-surface-variant">
        {Number(product.minStockThreshold || 0)} {Number(product.minStockThreshold || 0) === 1 ? 'unit' : 'units'}
      </td>
      <td className="py-4 px-4 font-item-title text-item-title text-right text-on-surface">
        {currency(product.purchasePrice)}
      </td>
      <td className="py-4 px-4 font-item-title text-item-title text-right text-on-surface">
        {currency(product.sellingPrice)}
      </td>
      <td className="py-4 px-4">
        <div className="flex justify-end">
          <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
        </div>
      </td>
      <td className="py-4 px-4 rounded-r-[18px]">
        <div className="flex items-center justify-end gap-2">
          {isAdmin ? (
            <>
              <button
                type="button"
                onClick={() => onEdit(product)}
                className="h-9 w-9 rounded-full bg-surface hover:bg-surface-container-high transition-colors flex items-center justify-center text-on-surface-variant"
                title="Edit"
              >
                <Pencil size={18} strokeWidth={1.8} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(product)}
                className="h-9 w-9 rounded-full bg-alert-tint hover:opacity-80 transition-colors flex items-center justify-center text-alert"
                title="Delete"
              >
                <Trash2 size={18} strokeWidth={1.8} />
              </button>
            </>
          ) : (
            <span className="font-caption text-caption text-on-surface-variant">View only</span>
          )}
        </div>
      </td>
    </tr>
  );
}

function InventoryCard({ product, isAdmin, onEdit, onDelete, currency }) {
  const state = stockState(product);
  const icon = categoryIcon(product.category);

  return (
    <div className="bg-paper rounded-[18px] border border-outline-variant/20 p-4 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-surface flex items-center justify-center shrink-0">
            <CategoryIcon name={icon} size={20} strokeWidth={1.8} className="text-on-surface-variant" />
          </div>
          <div className="min-w-0">
            <p className="font-item-title text-item-title text-on-surface truncate">{product.name}</p>
            <p className="font-caption text-caption text-on-surface-variant truncate">{product.category}</p>
          </div>
        </div>
        <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
        <div className="rounded-2xl bg-surface px-3 py-2">
          <p className="font-caption text-caption text-on-surface-variant">Stock</p>
          <p className="font-item-title text-item-title text-on-surface">{quantityLabel(product)}</p>
        </div>
        <div className="rounded-2xl bg-surface px-3 py-2">
          <p className="font-caption text-caption text-on-surface-variant">Reorder</p>
          <p className="font-item-title text-item-title text-on-surface">
            {Number(product.minStockThreshold || 0)} {Number(product.minStockThreshold || 0) === 1 ? 'unit' : 'units'}
          </p>
        </div>
        <div className="rounded-2xl bg-surface px-3 py-2">
          <p className="font-caption text-caption text-on-surface-variant">Buy</p>
          <p className="font-item-title text-item-title text-on-surface">{currency(product.purchasePrice)}</p>
        </div>
        <div className="rounded-2xl bg-surface px-3 py-2">
          <p className="font-caption text-caption text-on-surface-variant">Sell</p>
          <p className="font-item-title text-item-title text-on-surface">{currency(product.sellingPrice)}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-outline-variant/10">
        {isAdmin ? (
          <>
            <button
              type="button"
              onClick={() => onEdit(product)}
              className="h-9 w-9 rounded-full bg-surface hover:bg-surface-container-high transition-colors flex items-center justify-center text-on-surface-variant"
              title="Edit"
            >
              <Pencil size={18} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(product)}
              className="h-9 w-9 rounded-full bg-alert-tint hover:opacity-80 transition-colors flex items-center justify-center text-alert"
              title="Delete"
            >
              <Trash2 size={18} strokeWidth={1.8} />
            </button>
          </>
        ) : (
          <span className="font-caption text-caption text-on-surface-variant">View only</span>
        )}
      </div>
    </div>
  );
}

function TimelineItem({ icon, tone, title, subtitle, time }) {
  const tones = {
    success: 'bg-good-tint text-good',
    warn: 'bg-warn-tint text-warn',
    data: 'bg-data-tint text-data',
    alert: 'bg-alert-tint text-alert',
  };

  return (
    <div className="flex gap-4 relative">
      <div className={`z-10 h-7 w-7 rounded-full border-2 border-paper flex items-center justify-center ${tones[tone] || tones.data}`}>
        <MovementIcon name={icon} size={14} strokeWidth={1.8} />
      </div>
      <div className="flex-1 pb-5">
        <p className="font-item-title text-item-title text-on-surface">{title}</p>
        <p className="font-body text-body text-on-surface-variant">{subtitle}</p>
        <p className="font-caption text-caption text-ink-tertiary mt-1">{time}</p>
      </div>
    </div>
  );
}

function SupplierCard({ supplier, compact = false }) {
  return (
    <div className={`bg-paper rounded-[18px] px-3 py-3 flex items-center justify-between gap-3 shadow-[0_1px_0_rgba(0,0,0,0.04)] ${compact ? 'border border-outline-variant/10' : 'border border-outline-variant/15'}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 rounded-xl bg-surface flex items-center justify-center text-on-surface-variant shrink-0">
          <HeadsetIcon size={20} strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="font-item-title text-item-title text-on-surface truncate">{supplier.name}</p>
          <p className="font-caption text-caption text-on-surface-variant truncate">{supplier.contactNumber}</p>
          {supplier.note ? <p className="font-caption text-caption text-ink-tertiary truncate mt-0.5">{supplier.note}</p> : null}
        </div>
      </div>
    </div>
  );
}

function SupplierFormModal({ onClose, onSave, saving, error }) {
  const [form, setForm] = useState({ name: '', contactNumber: '', note: '' });

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      name: form.name.trim(),
      contactNumber: form.contactNumber.trim(),
      note: form.note.trim(),
    });
  };

  return (
    <ModalShell
      title="Add Supplier"
      description="Create a supplier contact that will appear in the inventory sidebar."
      icon={UserPlus}
      maxWidth="max-w-lg"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Supplier Name"
          icon={Store}
          value={form.name}
          onChange={update('name')}
          placeholder="Apex Bar Supplies"
          required
        />
        <FormInput
          label="Contact Number"
          icon={Phone}
          value={form.contactNumber}
          onChange={update('contactNumber')}
          placeholder="+92 300 000 0000"
          required
        />
        <div>
          <label className="block font-item-title text-item-title text-on-surface-variant mb-xs">Note</label>
          <textarea
            value={form.note}
            onChange={update('note')}
            placeholder="Next delivery: Tuesday"
            rows={3}
            className="block w-full px-sm py-sm bg-surface-container-lowest border border-outline-variant rounded-input text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200 resize-none"
          />
        </div>
        {error ? <p className="font-caption text-caption text-alert">{error}</p> : null}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-outline-variant px-5 py-2.5 font-item-title text-item-title text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-full bg-primary px-5 py-2.5 font-item-title text-item-title text-on-primary hover:bg-surface-tint transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Add Supplier'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function SupplierListModal({ suppliers, onClose }) {
  return (
    <ModalShell
      title="All Supplier Contacts"
      description={`${suppliers.length} supplier contact${suppliers.length === 1 ? '' : 's'} available in inventory.`}
      icon={Contact}
      maxWidth="max-w-3xl"
      onClose={onClose}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suppliers.map((supplier) => (
          <SupplierCard key={supplier.id} supplier={supplier} />
        ))}
      </div>
    </ModalShell>
  );
}

export default function Inventory() {
  const { user } = useAuth();
  const { formatCurrency: currency } = useSettings();
  const isAdmin = user?.role === 'super_admin';

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [supplierSaving, setSupplierSaving] = useState(false);
  const [error, setError] = useState('');
  const [supplierError, setSupplierError] = useState('');
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [activeProduct, setActiveProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showSupplierList, setShowSupplierList] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toastTimerRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, movementRes, suppliersRes] = await Promise.all([
        api.get('/cafe/products?page=1&limit=100'),
        api.get('/inventory?page=1&limit=6'),
        api.get('/suppliers?page=1&limit=100'),
      ]);
      setProducts(productsRes.data.data || []);
      setMovements(movementRes.data.data || []);
      setSuppliers(suppliersRes.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory');
      setProducts([]);
      setMovements([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categories = useMemo(() => {
    return [...new Set(products.map((product) => product.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query);
      const matchesCategory = category === 'all' || product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, products, search]);

  const stats = useMemo(() => {
    const totalValue = products.reduce((sum, product) => sum + Number(product.purchasePrice || 0) * Number(product.stockQuantity || 0), 0);
    const lowStock = products.filter((product) => Number(product.stockQuantity || 0) <= Number(product.minStockThreshold || 0)).length;
    const available = products.filter((product) => product.isAvailable).length;
    const totalUnits = products.reduce((sum, product) => sum + Number(product.stockQuantity || 0), 0);

    return { totalValue, lowStock, available, totalUnits };
  }, [products]);

  const showMessage = (message) => {
    setToast(message);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 3000);
  };

  const openCreate = () => {
    setError('');
    setActiveProduct(null);
    setShowForm(true);
  };

  const openSupplierForm = () => {
    if (!isAdmin) return;
    setSupplierError('');
    setShowSupplierForm(true);
  };

  const openEdit = (product) => {
    setError('');
    setActiveProduct(product);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setActiveProduct(null);
  };

  const closeSupplierForm = () => {
    setShowSupplierForm(false);
    setSupplierError('');
  };

  const handleSave = async (payload) => {
    setSaving(true);
    setError('');
    try {
      if (activeProduct) {
        await api.put(`/cafe/products/${activeProduct._id}`, payload);
        showMessage('Inventory item updated');
      } else {
        await api.post('/cafe/products', payload);
        showMessage('Inventory item created');
      }
      closeForm();
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setSaving(true);
    setError('');
    try {
      await api.delete(`/cafe/products/${deleteTarget._id}`);
      showMessage('Inventory item removed');
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete item');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSupplier = async (payload) => {
    if (!payload.name || !payload.contactNumber) {
      setSupplierError('Supplier name and contact number are required');
      return;
    }

    setSupplierSaving(true);
    setSupplierError('');
    try {
      await api.post('/suppliers', payload);
      showMessage('Supplier contact added');
      closeSupplierForm();
      await loadData();
    } catch (err) {
      setSupplierError(err.response?.data?.message || 'Failed to add supplier');
    } finally {
      setSupplierSaving(false);
    }
  };

  const exportCsv = () => {
    const csv = buildExportCsv(filteredProducts);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const movementItems = movements.map((record) => {
    const typeMap = {
      purchase: { tone: 'success', icon: 'north_east', title: 'Restock' },
      adjustment: { tone: 'data', icon: 'sync', title: 'Adjustment' },
      sale: { tone: 'warn', icon: 'south_east', title: 'Sale' },
      return: { tone: 'success', icon: 'undo', title: 'Return' },
      waste: { tone: 'alert', icon: 'delete', title: 'Waste' },
    };
    const meta = typeMap[record.type] || typeMap.adjustment;
    const productName = record.product?.name || 'Unknown item';
    const quantity = Number(record.quantity || 0);
    const subtitle =
      record.type === 'purchase'
        ? `${quantity} units added by ${record.createdBy?.name || 'staff'}`
        : record.type === 'adjustment'
          ? `${quantity >= 0 ? '+' : ''}${quantity} units adjusted`
          : `${Math.abs(quantity)} units ${quantity >= 0 ? 'added' : 'removed'}`;

    return {
      ...meta,
      title: `${meta.title}: ${productName}`,
      subtitle,
      time: formatRelativeDate(record.createdAt),
    };
  });

  return (
    <AppLayout>
      {showForm && (
        <InventoryModal
          mode={activeProduct ? 'edit' : 'create'}
          product={activeProduct}
          categories={categories}
          onClose={closeForm}
          onSave={handleSave}
          saving={saving}
          error={error}
          onClearError={() => setError('')}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete inventory item?"
          description={`This will deactivate "${deleteTarget.name}" from the inventory list.`}
          confirmLabel="Delete"
          confirmTone="danger"
          icon={AlertTriangle}
          loading={saving}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {showSupplierForm && isAdmin && (
        <SupplierFormModal
          onClose={closeSupplierForm}
          onSave={handleAddSupplier}
          saving={supplierSaving}
          error={supplierError}
        />
      )}

      {showSupplierList && (
        <SupplierListModal
          suppliers={suppliers}
          onClose={() => setShowSupplierList(false)}
        />
      )}

      <Toast message={toast} type="success" />
      {error && !showForm && !deleteTarget ? <Toast message={error} type="error" onClose={() => setError('')} /> : null}

      <div className="mb-5 md:mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="font-caption text-[11px] md:text-caption text-on-surface-variant uppercase tracking-[0.22em]">Resource Tracking</p>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <h2 className="font-headline text-[30px] md:text-[38px] xl:text-headline text-on-background leading-none">Inventory</h2>
            {!isAdmin && <StatusBadge tone="data">View only access</StatusBadge>}
          </div>
          <p className="font-body text-[13px] md:text-body text-on-surface-variant mt-2">
            Monitor stock levels, review recent movement, and manage products when you have admin access.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 font-item-title text-[13px] md:text-item-title text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <Download size={17} strokeWidth={1.8} />
            Export
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-item-title text-[13px] md:text-item-title text-on-primary hover:bg-surface-tint transition-colors"
            >
              <Plus size={17} strokeWidth={1.8} />
              Update Stock
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-5 md:mb-6">
        <MetricCard
          label="Total Inventory Value"
          value={currency(stats.totalValue)}
          icon={Wallet}
          note={`${products.length} items`}
          accent={{ bg: 'bg-surface-container-lowest', text: 'text-on-surface', pill: 'bg-good-tint text-good' }}
        />
        <MetricCard
          label="Low Stock Alerts"
          value={String(stats.lowStock)}
          icon={AlertTriangle}
          note="Action required"
          accent={{ bg: 'bg-warn-tint', text: 'text-warn', pill: 'bg-white/60 text-warn' }}
        />
        <MetricCard
          label="Stocked Units"
          value={String(stats.totalUnits)}
          icon={Package}
          note={`${stats.available} active`}
          accent={{ bg: 'bg-data-tint', text: 'text-data', pill: 'bg-data-tint text-data' }}
        />
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,2fr)_320px] gap-4 md:gap-5">
        <PanelCard
          title="Detailed Stock Ledger"
          action={
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="rounded-full border border-outline-variant bg-paper px-3 py-2 w-full sm:w-auto">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search inventory..."
                  className="w-full sm:w-44 bg-transparent border-0 p-0 font-body text-[13px] md:text-body text-on-surface placeholder:text-on-surface-variant/70 focus:ring-0"
                />
              </div>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="rounded-full border border-outline-variant bg-paper px-4 py-2 font-item-title text-[13px] md:text-item-title text-on-surface focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="all">All categories</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          }
          className="overflow-hidden"
        >
          <div className="grid gap-3 md:gap-4 2xl:hidden">
            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <Loader2 size={32} strokeWidth={1.5} className="animate-spin text-on-surface-variant" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No inventory items found"
                description={search || category !== 'all' ? 'Try a different search or clear the category filter.' : 'Add your first inventory item to start tracking stock.'}
                action={isAdmin ? (
                  <button
                    type="button"
                    onClick={openCreate}
                    className="rounded-full bg-primary px-5 py-2.5 font-item-title text-item-title text-on-primary hover:bg-surface-tint transition-colors"
                  >
                    Add Item
                  </button>
                ) : null}
              />
            ) : (
              filteredProducts.map((product) => (
                <InventoryCard
                  key={product._id}
                  product={product}
                  isAdmin={isAdmin}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                  currency={currency}
                />
              ))
            )}
          </div>

          <div className="hidden 2xl:block overflow-x-auto">
            <table className="w-full min-w-[920px] border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-on-surface-variant font-caption text-caption">
                  <th className="pb-2 px-4 font-normal">Item Description</th>
                  <th className="pb-2 px-4 font-normal">Current Level</th>
                  <th className="pb-2 px-4 font-normal">Reorder Level</th>
                  <th className="pb-2 px-4 font-normal text-right">Purchase Price</th>
                  <th className="pb-2 px-4 font-normal text-right">Selling Price</th>
                  <th className="pb-2 px-4 font-normal text-right">Status</th>
                  <th className="pb-2 px-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-20">
                      <div className="flex items-center justify-center">
                        <Loader2 size={32} strokeWidth={1.5} className="animate-spin text-on-surface-variant" />
                      </div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4">
                      <EmptyState
                        icon={Package}
                        title="No inventory items found"
                        description={search || category !== 'all' ? 'Try a different search or clear the category filter.' : 'Add your first inventory item to start tracking stock.'}
                        action={
                          isAdmin ? (
                            <button
                              type="button"
                              onClick={openCreate}
                              className="rounded-full bg-primary px-5 py-2.5 font-item-title text-item-title text-on-primary hover:bg-surface-tint transition-colors"
                            >
                              Add Item
                            </button>
                          ) : null
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <InventoryRow
                      key={product._id}
                      product={product}
                      isAdmin={isAdmin}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                      currency={currency}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </PanelCard>

        <div className="space-y-4 md:space-y-5">
          <PanelCard title="Recent Movement">
            {movementItems.length > 0 ? (
              <div className="relative">
                <div className="absolute left-[14px] top-4 bottom-4 w-px bg-on-surface-variant opacity-20" />
                {movementItems.map((item, index) => (
                  <TimelineItem
                    key={`${item.title}-${index}`}
                    icon={item.icon}
                    tone={item.tone}
                    title={item.title}
                    subtitle={item.subtitle}
                    time={item.time}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={RefreshCw}
                title="No recent movement"
                description="Stock changes will appear here once inventory actions are recorded."
              />
            )}
          </PanelCard>

          <PanelCard
            title="Supplier Contacts"
            action={
              isAdmin ? (
                <button
                  type="button"
                  onClick={openSupplierForm}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 font-item-title text-item-title text-on-primary hover:bg-surface-tint transition-colors"
                >
                  <Plus size={18} strokeWidth={1.8} />
                  Add
                </button>
              ) : null
            }
          >
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-3">
                {suppliers.slice(0, 2).map((supplier) => (
                  <SupplierCard key={supplier.id} supplier={supplier} compact />
                ))}
              </div>
              {suppliers.length > 2 ? (
                <div className="flex justify-end">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary font-title text-[16px] shadow-sm">
                    +{suppliers.length - 2}
                  </div>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setShowSupplierList(true)}
              className="mt-4 w-full rounded-full border-2 border-primary px-5 py-2.5 font-item-title text-item-title text-primary hover:bg-primary hover:text-on-primary transition-colors"
            >
              View All Suppliers
            </button>
          </PanelCard>
        </div>
      </div>
    </AppLayout>
  );
}
