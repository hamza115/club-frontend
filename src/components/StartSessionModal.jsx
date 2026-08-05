import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';
import { formatCurrency } from '../lib/currency';
import { useSettings } from '../context/SettingsContext';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/styles/overlayscrollbars.css';
import {
  Play,
  X,
  UserPlus,
  User,
  Loader2,
  CheckCircle2,
  Phone,
  CreditCard,
  CircleDot,
  PlayCircle,
} from 'lucide-react';

export default function StartSessionModal({ table, onClose, onStarted }) {
  const { currencyCode } = useSettings();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerId, setCustomerId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [pricingMethod, setPricingMethod] = useState('hourly');
  const [customRate, setCustomRate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nameInputRef = useRef(null);
  const searchTimerRef = useRef(null);
  const suggestionsRef = useRef(null);

  const hourlyRate = table?.hourlyRate || 0;
  const frameRate = table?.frameRate || 0;
  const perMinuteRate = table?.perMinuteRate || 0;
  const displayRate = pricingMethod === 'hourly' ? hourlyRate : pricingMethod === 'per_minute' ? perMinuteRate : frameRate;

  useEffect(() => {
    if (table?.hourlyRate) {
      setCustomRate(String(table.hourlyRate));
    }
  }, [table?.hourlyRate]);

  const searchCustomers = useCallback(async (query) => {
    if (!query || query.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get('/customers/search', { params: { q: query.trim() } });
      const results = res.data.data || [];
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setHighlightIndex(-1);
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleNameChange(value) {
    setCustomerName(value);
    setCustomerId(null);
    setHighlightIndex(-1);

    clearTimeout(searchTimerRef.current);
    if (value.trim().length >= 1) {
      searchTimerRef.current = setTimeout(() => searchCustomers(value), 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function selectCustomer(customer) {
    setCustomerId(customer._id);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone || '');
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightIndex(-1);
  }

  function handleNameKeyDown(e) {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      selectCustomer(suggestions[highlightIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && nameInputRef.current && !nameInputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        tableId: table._id,
        pricingMethod,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        notes: notes.trim(),
      };

      if (customerId) {
        payload.customerId = customerId;
      }

      if (pricingMethod === 'hourly' && customRate) {
        payload.hourlyRate = Number(customRate);
      }

      if (pricingMethod === 'per_minute') {
        payload.perMinuteRate = perMinuteRate;
      }

      const res = await api.post('/sessions', payload);
      onStarted?.(res.data.data.session);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-on-background/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <OverlayScrollbarsComponent
        defer
        options={{
          scrollbars: { autoHide: 'leave', autoHideDelay: 300 },
          overflow: { x: 'hidden', y: 'scroll' },
        }}
        className="relative bg-paper rounded-2xl md:rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-outline-variant/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-outline-variant/20 sticky top-0 bg-paper z-10 rounded-t-2xl md:rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ink-raised text-on-primary flex items-center justify-center">
              <Play size={20} strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="font-item-title text-item-title text-on-surface">Start Session</h2>
              <p className="font-caption text-caption text-on-surface-variant">Table {String(table?.tableNumber || '').padStart(2, '0')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 md:p-6">
            {/* Left Column */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Customer Identification */}
              <section className="bg-surface rounded-2xl p-5 border border-surface-variant/50 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-ink-raised text-on-primary flex items-center justify-center">
                    <UserPlus size={18} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="font-item-title text-item-title text-on-surface">Customer Identification</h3>
                    <p className="font-caption text-caption text-on-surface-variant">Assign player to this table session</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Name — with autocomplete */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-caption text-caption font-semibold ml-1 text-on-surface">Customer Name</label>
                    <div className="relative">
                      <div className="relative bg-surface-container-lowest border border-surface-variant rounded-lg focus-within:border-primary focus-within:bg-paper transition-all">
                        <User size={20} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                        <input
                          ref={nameInputRef}
                          type="text"
                          value={customerName}
                          onChange={(e) => handleNameChange(e.target.value)}
                          onKeyDown={handleNameKeyDown}
                          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                          className="w-full pl-10 pr-10 py-2.5 bg-transparent border-none focus:ring-0 text-body font-body"
                          placeholder="Type to search or enter name"
                          required
                          autoComplete="off"
                        />
                        {searching && (
                          <Loader2 size={18} strokeWidth={1.8} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant animate-spin" />
                        )}
                        {!searching && customerId && (
                          <CheckCircle2 size={18} strokeWidth={1.8} className="absolute right-3 top-1/2 -translate-y-1/2 text-good" />
                        )}
                      </div>

                      {/* Autocomplete Dropdown */}
                      {showSuggestions && (
                        <div ref={suggestionsRef} className="absolute z-50 top-full left-0 right-0 mt-1 bg-paper rounded-xl border border-outline-variant/20 shadow-lg max-h-[200px] overflow-y-auto">
                          {suggestions.map((customer, i) => (
                            <button
                              key={customer._id}
                              type="button"
                              onClick={() => selectCustomer(customer)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                i === highlightIndex ? 'bg-primary-tint text-on-surface' : 'hover:bg-surface-container-high text-on-surface'
                              }`}
                            >
                              <User size={18} strokeWidth={1.8} className="text-on-surface-variant" />
                              <div className="flex-1 min-w-0">
                                <p className="font-item-title text-item-title truncate">{customer.name}</p>
                                {customer.phone && (
                                  <p className="font-caption text-caption text-on-surface-variant">{customer.phone}</p>
                                )}
                              </div>
                              {customer.visitCount > 0 && (
                                <span className="font-caption text-caption text-on-surface-variant shrink-0">{customer.visitCount} visit{customer.visitCount !== 1 ? 's' : ''}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {customerId && (
                      <p className="font-caption text-caption text-good ml-1">Existing customer selected</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-caption text-caption font-semibold ml-1 text-on-surface">Phone Number (Optional)</label>
                    <div className="relative bg-surface-container-lowest border border-surface-variant rounded-lg focus-within:border-primary focus-within:bg-paper transition-all">
                      <Phone size={20} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-transparent border-none focus:ring-0 text-body font-body"
                        placeholder="+92 300 0000000"
                        disabled={!!customerId}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Session Parameters */}
              <section className="bg-surface rounded-2xl p-5 border border-surface-variant/50 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-ink-raised text-on-primary flex items-center justify-center">
                    <CreditCard size={18} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="font-item-title text-item-title text-on-surface">Session Parameters</h3>
                    <p className="font-caption text-caption text-on-surface-variant">Configure rates and billing logic</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-3">
                    <label className="font-caption text-caption font-semibold ml-1 text-on-surface">Pricing Method</label>
                    <div className="flex flex-wrap p-1 bg-surface-container-high rounded-xl w-fit gap-1">
                      <button
                        type="button"
                        onClick={() => setPricingMethod('hourly')}
                        className={`px-4 py-2 rounded-lg font-item-title text-item-title transition-all ${
                          pricingMethod === 'hourly'
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'bg-surface text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        Hourly
                      </button>
                      <button
                        type="button"
                        onClick={() => setPricingMethod('frame')}
                        className={`px-4 py-2 rounded-lg font-item-title text-item-title transition-all ${
                          pricingMethod === 'frame'
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'bg-surface text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        Per Frame
                      </button>
                      <button
                        type="button"
                        onClick={() => setPricingMethod('per_minute')}
                        className={`px-4 py-2 rounded-lg font-item-title text-item-title transition-all ${
                          pricingMethod === 'per_minute'
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'bg-surface text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        Per Minute
                      </button>
                    </div>
                  </div>

                  {pricingMethod === 'hourly' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="font-caption text-caption font-semibold ml-1 text-on-surface">Custom Hourly Rate ({currencyCode})</label>
                      <div className="relative bg-surface-container-lowest border border-surface-variant rounded-lg focus-within:border-primary focus-within:bg-paper transition-all">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-item-title text-on-surface-variant">{currencyCode}</span>
                        <input
                          type="number"
                          value={customRate}
                          onChange={(e) => setCustomRate(e.target.value)}
                          className="w-full pl-12 pr-4 py-2.5 bg-transparent border-none focus:ring-0 text-body font-body"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>
                  )}

                  {pricingMethod === 'frame' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="font-caption text-caption font-semibold ml-1 text-on-surface">Frame Rate ({currencyCode})</label>
                      <div className="relative bg-surface-container-lowest border border-surface-variant rounded-lg focus-within:border-primary focus-within:bg-paper transition-all">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-item-title text-on-surface-variant">{currencyCode}</span>
                        <input
                          type="number"
                          value={frameRate}
                          className="w-full pl-12 pr-4 py-2.5 bg-transparent border-none focus:ring-0 text-body font-body"
                          disabled
                        />
                      </div>
                    </div>
                  )}

                  {pricingMethod === 'per_minute' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="font-caption text-caption font-semibold ml-1 text-on-surface">Per Minute Rate ({currencyCode})</label>
                      <div className="relative bg-surface-container-lowest border border-surface-variant rounded-lg focus-within:border-primary focus-within:bg-paper transition-all">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-item-title text-on-surface-variant">{currencyCode}</span>
                        <input
                          type="number"
                          value={perMinuteRate}
                          className="w-full pl-12 pr-4 py-2.5 bg-transparent border-none focus:ring-0 text-body font-body"
                          disabled
                        />
                      </div>
                      <p className="font-caption text-caption text-on-surface-variant ml-1">
                        = {formatCurrency(perMinuteRate * 60)}/hr
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-caption text-caption font-semibold ml-1 text-on-surface">Internal Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-4 bg-surface-container-lowest border border-surface-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-body font-body resize-none"
                    placeholder="Add session notes (e.g., equipment rental, tournament play)..."
                    rows="3"
                  />
                </div>
              </section>
            </div>

            {/* Right Column — Table Info & Summary */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <section className="bg-surface rounded-2xl p-5 border border-surface-variant/50 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-data-tint text-data flex items-center justify-center">
                    <CircleDot size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-item-title text-item-title text-on-surface">
                      Table {String(table?.tableNumber || '').padStart(2, '0')}
                    </h3>
                    <p className="font-caption text-caption text-on-surface-variant">Ready for session</p>
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="p-4 bg-surface-container-lowest rounded-xl flex flex-col gap-2 border border-outline-variant/10">
                  <div className="flex justify-between items-center font-body text-body">
                    <span className="text-on-surface-variant">Pricing Method</span>
                    <span className="font-bold text-on-surface capitalize">
                      {pricingMethod === 'hourly' ? 'Hourly' : pricingMethod === 'per_minute' ? 'Per Minute' : 'Per Frame'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-body text-body">
                    <span className="text-on-surface-variant">
                      {pricingMethod === 'hourly' ? 'Hourly Rate' : pricingMethod === 'per_minute' ? 'Per Minute Rate' : 'Frame Rate'}
                    </span>
                    <span className="font-bold text-on-surface">{formatCurrency(displayRate)}</span>
                  </div>
                  <div className="h-px bg-outline-variant/30 my-1" />
                  <div className="flex justify-between items-center font-item-title text-item-title text-primary">
                    <span>Base Rate</span>
                    <span className="font-bold">
                      {formatCurrency(displayRate)} / {pricingMethod === 'hourly' ? 'hr' : pricingMethod === 'per_minute' ? 'min' : 'frame'}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-status-alert-tint text-status-alert rounded-xl font-caption text-caption">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !customerName.trim()}
                  className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-item-title text-[15px] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <Loader2 size={20} strokeWidth={1.8} className="animate-spin" />
                  ) : (
                    <PlayCircle size={20} strokeWidth={1.8} />
                  )}
                  {loading ? 'Starting...' : 'Start Session'}
                </button>
              </section>
            </div>
          </div>
        </form>
      </OverlayScrollbarsComponent>
    </div>
  );
}
