import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/useAuth';
import api from '../lib/api';
import {
  CheckCheck, Archive, List, LayoutGrid, Loader2, BellOff,
  Check, Trash2, ChevronLeft, ChevronRight,
  Package, Timer, CreditCard, Coffee, Receipt, User,
  CloudUpload, FileText, Info,
} from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'session', label: 'Sessions' },
  { value: 'payment', label: 'Payments' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'expense', label: 'Expenses' },
  { value: 'user', label: 'User Management' },
  { value: 'backup', label: 'Backup' },
  { value: 'daily_closing', label: 'Daily Closing' },
  { value: 'system', label: 'System' },
];

const PRIORITIES = [
  { value: '', label: 'All Priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const READ_FILTERS = [
  { value: '', label: 'All' },
  { value: 'false', label: 'Unread' },
  { value: 'true', label: 'Read' },
];

const CATEGORY_CONFIG = {
  inventory: { Icon: Package, color: 'text-amber-600 bg-amber-50' },
  session: { Icon: Timer, color: 'text-blue-600 bg-blue-50' },
  payment: { Icon: CreditCard, color: 'text-green-600 bg-green-50' },
  cafe: { Icon: Coffee, color: 'text-orange-600 bg-orange-50' },
  expense: { Icon: Receipt, color: 'text-purple-600 bg-purple-50' },
  user: { Icon: User, color: 'text-indigo-600 bg-indigo-50' },
  backup: { Icon: CloudUpload, color: 'text-teal-600 bg-teal-50' },
  daily_closing: { Icon: FileText, color: 'text-cyan-600 bg-cyan-50' },
  system: { Icon: Info, color: 'text-gray-600 bg-gray-50' },
};

const PRIORITY_BADGE = {
  high: { label: 'High', className: 'bg-red-50 text-red-700 border-red-200' },
  medium: { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  low: { label: 'Low', className: 'bg-gray-50 text-gray-600 border-gray-200' },
};

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    markAsRead,
    markAllAsRead,
    archiveNotification,
    archiveAllRead,
    deleteNotification,
    unreadCount,
    fetchUnreadCount,
  } = useNotifications();

  // Local state — independent from the bell dropdown
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({ page: 1, limit: 15, total: 0, totalPages: 0 });

  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('list');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('page', String(page));
      query.set('limit', '15');
      if (category) query.set('category', category);
      if (priority) query.set('priority', priority);
      if (readFilter) query.set('isRead', readFilter);

      const res = await api.get(`/notifications?${query.toString()}`);
      setNotifications(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error('Failed to load notifications:', err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [page, category, priority, readFilter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Refresh unread count when page mounts
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      await markAsRead(n._id);
      setNotifications((prev) =>
        prev.map((item) => (item._id === n._id ? { ...item, isRead: true, readAt: new Date() } : item)),
      );
    }
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date() })));
  };

  const handleArchiveAllRead = async () => {
    await archiveAllRead();
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    loadNotifications();
  };

  const handleArchive = async (e, id) => {
    e.stopPropagation();
    await archiveNotification(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const totalPages = meta.totalPages || 1;

  const getCategoryLabel = (cat) => {
    const found = CATEGORIES.find((c) => c.value === cat);
    return found ? found.label : cat;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-title text-headline text-on-surface">Notifications</h1>
          <p className="text-body text-on-surface-variant mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 rounded-full bg-surface text-on-surface hover:bg-surface-container-high border border-outline-variant/30 transition-colors text-sm font-semibold"
            >
              <CheckCheck size={16} strokeWidth={1.8} className="inline mr-1 align-middle" />
              Mark all read
            </button>
          )}
          <button
            onClick={handleArchiveAllRead}
            className="px-4 py-2 rounded-full bg-surface text-on-surface hover:bg-surface-container-high border border-outline-variant/30 transition-colors text-sm font-semibold"
          >
            <Archive size={16} strokeWidth={1.8} className="inline mr-1 align-middle" />
            Archive read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={handleFilterChange(setCategory)}
          className="px-3 py-2 rounded-full bg-surface border border-outline-variant/30 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={priority}
          onChange={handleFilterChange(setPriority)}
          className="px-3 py-2 rounded-full bg-surface border border-outline-variant/30 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        >
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <select
          value={readFilter}
          onChange={handleFilterChange(setReadFilter)}
          className="px-3 py-2 rounded-full bg-surface border border-outline-variant/30 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        >
          {READ_FILTERS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-1 bg-surface rounded-full border border-outline-variant/30 p-0.5">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-full transition-colors ${viewMode === 'list' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <List size={18} strokeWidth={1.8} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <LayoutGrid size={18} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Notification List */}
      {loading && notifications.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} strokeWidth={1.8} className="animate-spin text-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <BellOff size={48} strokeWidth={1.5} className="text-on-surface-variant/30 mb-3" />
          <p className="text-on-surface-variant font-body">No notifications found</p>
          <p className="text-on-surface-variant/60 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="bg-paper rounded-2xl border border-outline-variant/20 overflow-hidden">
          <div className="divide-y divide-outline-variant/10">
            {notifications.map((n) => {
              const catConfig = CATEGORY_CONFIG[n.category] || CATEGORY_CONFIG.system;
              const priBadge = PRIORITY_BADGE[n.priority] || PRIORITY_BADGE.low;
              const CatIcon = catConfig.Icon;
              return (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex items-start gap-4 px-4 sm:px-6 py-4 cursor-pointer transition-colors group ${
                    n.isRead ? 'hover:bg-surface-container/30' : 'bg-primary-tint/20 hover:bg-primary-tint/40'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${catConfig.color}`}>
                    <CatIcon size={18} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm ${n.isRead ? 'text-on-surface-variant' : 'text-on-surface font-semibold'}`}>
                        {n.title}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priBadge.className}`}>
                        {priBadge.label}
                      </span>
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-on-surface-variant mt-0.5 line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-on-surface-variant/60">
                      <span>{getCategoryLabel(n.category)}</span>
                      <span>·</span>
                      <span>{formatTimeAgo(n.createdAt)}</span>
                      {n.link && (
                        <>
                          <span>·</span>
                          <span className="text-primary">View details</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!n.isRead && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAsRead(n._id); setNotifications((prev) => prev.map((item) => (item._id === n._id ? { ...item, isRead: true, readAt: new Date() } : item))); }}
                        className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
                        title="Mark as read"
                      >
                        <Check size={18} strokeWidth={1.8} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleArchive(e, n._id)}
                      className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
                      title="Archive"
                    >
                      <Archive size={18} strokeWidth={1.8} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, n._id)}
                      className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-alert transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notifications.map((n) => {
            const catConfig = CATEGORY_CONFIG[n.category] || CATEGORY_CONFIG.system;
            const priBadge = PRIORITY_BADGE[n.priority] || PRIORITY_BADGE.low;
            const CatIcon = catConfig.Icon;
            return (
              <div
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                className={`rounded-2xl border border-outline-variant/20 p-4 cursor-pointer transition-all group hover:shadow-md ${
                  n.isRead ? 'bg-paper' : 'bg-primary-tint/10 border-primary/20'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center ${catConfig.color}`}>
                    <CatIcon size={18} strokeWidth={1.8} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priBadge.className}`}>
                      {priBadge.label}
                    </span>
                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                </div>
                <p className={`text-sm ${n.isRead ? 'text-on-surface-variant' : 'text-on-surface font-semibold'} line-clamp-1`}>
                  {n.title}
                </p>
                <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{n.message}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-on-surface-variant/60">{formatTimeAgo(n.createdAt)}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.isRead && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAsRead(n._id); setNotifications((prev) => prev.map((item) => (item._id === n._id ? { ...item, isRead: true, readAt: new Date() } : item))); }}
                        className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
                        title="Mark as read"
                      >
                        <Check size={16} strokeWidth={1.8} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleArchive(e, n._id)}
                      className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
                      title="Archive"
                    >
                      <Archive size={16} strokeWidth={1.8} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, n._id)}
                      className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-alert transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} strokeWidth={1.8} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce((acc, p, i, arr) => {
              if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-on-surface-variant text-sm">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-9 w-9 rounded-full text-sm font-semibold transition-colors ${
                    page === p
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {p}
                </button>
              ),
            )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={20} strokeWidth={1.8} />
          </button>
        </div>
      )}
    </div>
  );
}
