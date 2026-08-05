import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  Package,
  Timer,
  CreditCard,
  Coffee,
  Receipt,
  User,
  CloudUpload,
  FileText,
  Info,
  Check,
  Archive,
  Trash2,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/styles/overlayscrollbars.css';
import api from '../lib/api';
import ModalShell from './ModalShell';

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

const CATEGORY_LABELS = {
  inventory: 'Inventory',
  session: 'Sessions',
  payment: 'Payments',
  cafe: 'Cafe',
  expense: 'Expenses',
  user: 'Users',
  backup: 'Backup',
  daily_closing: 'Daily Closing',
  system: 'System',
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

function NotificationItem({ n, onClick, onArchive, onDelete, showActions = true }) {
  const catConfig = CATEGORY_CONFIG[n.category] || CATEGORY_CONFIG.system;
  const priBadge = PRIORITY_BADGE[n.priority] || PRIORITY_BADGE.low;
  const CatIcon = catConfig.Icon;

  return (
    <div
      onClick={() => onClick(n)}
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors group ${
        n.isRead ? 'hover:bg-surface-container/50' : 'bg-primary-tint/20 hover:bg-primary-tint/40'
      }`}
    >
      <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${catConfig.color}`}>
        <CatIcon size={18} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm truncate ${n.isRead ? 'text-on-surface-variant' : 'text-on-surface font-semibold'}`}>
            {n.title}
          </p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priBadge.className}`}>
            {priBadge.label}
          </span>
          {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
        </div>
        <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{n.message}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-on-surface-variant/60">{CATEGORY_LABELS[n.category] || n.category}</span>
          <span className="text-[10px] text-on-surface-variant/40">·</span>
          <span className="text-[10px] text-on-surface-variant/60">{formatTimeAgo(n.createdAt)}</span>
          {n.link && (
            <>
              <span className="text-[10px] text-on-surface-variant/40">·</span>
              <span className="text-[10px] text-primary">View</span>
            </>
          )}
        </div>
      </div>
      {showActions && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {!n.isRead && (
            <button
              onClick={(e) => { e.stopPropagation(); onClick(n); }}
              className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
              title="Mark as read"
            >
              <Check size={14} strokeWidth={1.8} />
            </button>
          )}
          <button
            onClick={(e) => onArchive(e, n._id)}
            className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
            title="Archive"
          >
            <Archive size={14} strokeWidth={1.8} />
          </button>
          <button
            onClick={(e) => onDelete(e, n._id)}
            className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-alert transition-colors"
            title="Delete"
          >
            <Trash2 size={14} strokeWidth={1.8} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const {
    unreadCount,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    archiveAllRead,
    fetchUnreadCount,
  } = useNotifications();

  // Local state for dropdown preview — independent from the full page context
  const [dropdownNotifications, setDropdownNotifications] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [dropdownFilter, setDropdownFilter] = useState('all');

  // Local state for "View All" modal
  const [modalNotifications, setModalNotifications] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMeta, setModalMeta] = useState({ page: 1, limit: 15, total: 0, totalPages: 0 });
  const [modalCategory, setModalCategory] = useState('');
  const [modalPriority, setModalPriority] = useState('');
  const [modalPage, setModalPage] = useState(1);
  const [modalReadFilter, setModalReadFilter] = useState('all');

  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const panelRef = useRef(null);
  const bellRef = useRef(null);

  // Fetch notifications for the dropdown preview (local state)
  const fetchDropdownNotifications = useCallback(async () => {
    setDropdownLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('page', '1');
      query.set('limit', '20');
      if (dropdownFilter === 'unread') query.set('isRead', 'false');
      const res = await api.get(`/notifications?${query.toString()}`);
      setDropdownNotifications(res.data.data);
    } catch (err) {
      console.error('Failed to fetch dropdown notifications:', err?.response?.data?.message || err.message);
    } finally {
      setDropdownLoading(false);
    }
  }, [dropdownFilter]);

  // Fetch notifications for the "View All" modal (local state)
  const fetchModalNotifications = useCallback(async () => {
    setModalLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('page', String(modalPage));
      query.set('limit', '15');
      if (modalCategory) query.set('category', modalCategory);
      if (modalPriority) query.set('priority', modalPriority);
      if (modalReadFilter === 'unread') query.set('isRead', 'false');
      else if (modalReadFilter === 'read') query.set('isRead', 'true');
      const res = await api.get(`/notifications?${query.toString()}`);
      setModalNotifications(res.data.data);
      setModalMeta(res.data.meta);
    } catch (err) {
      console.error('Failed to fetch modal notifications:', err?.response?.data?.message || err.message);
    } finally {
      setModalLoading(false);
    }
  }, [modalPage, modalCategory, modalPriority, modalReadFilter]);

  // Fetch dropdown notifications when dropdown opens or filter changes
  useEffect(() => {
    if (open) {
      fetchDropdownNotifications();
    }
  }, [open, dropdownFilter, fetchDropdownNotifications]);

  // Fetch modal notifications when modal opens or filters change
  useEffect(() => {
    if (showAll) {
      fetchModalNotifications();
    }
  }, [showAll, fetchModalNotifications]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target) && bellRef.current && !bellRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
      // Update local state too
      setDropdownNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, isRead: true, readAt: new Date() } : n)),
      );
    }
    if (notification.link) {
      setOpen(false);
      setShowAll(false);
      navigate(notification.link);
    }
  };

  const handleModalNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
      setModalNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, isRead: true, readAt: new Date() } : n)),
      );
    }
    if (notification.link) {
      setShowAll(false);
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    // Update local states
    setDropdownNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date() })));
    setModalNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date() })));
  };

  const handleArchive = async (e, id) => {
    e.stopPropagation();
    await archiveNotification(id);
    setDropdownNotifications((prev) => prev.filter((n) => n._id !== id));
    setModalNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteNotification(id);
    setDropdownNotifications((prev) => prev.filter((n) => n._id !== id));
    setModalNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const handleArchiveAllRead = async () => {
    await archiveAllRead();
    setModalNotifications((prev) => prev.filter((n) => !n.isRead));
    fetchModalNotifications();
  };

  const filteredDropdownNotifications = dropdownFilter === 'unread'
    ? dropdownNotifications.filter((n) => !n.isRead)
    : dropdownNotifications;

  const totalPages = modalMeta.totalPages || 1;

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={() => setOpen(!open)}
        className="h-9 w-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all relative"
        title="Notifications"
      >
        <Bell size={20} strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-status-alert text-on-primary rounded-full text-[10px] font-bold flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-paper rounded-2xl border border-outline-variant/20 shadow-2xl z-[60] flex flex-col"
          style={{ maxHeight: 'min(520px, 80vh)' }}
        >
          <div className="px-4 pt-4 pb-2 border-b border-outline-variant/20 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-title text-title text-on-surface font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-primary text-xs font-semibold hover:underline">
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => { setOpen(false); setShowAll(true); }}
                  className="text-primary text-xs font-semibold hover:underline"
                >
                  View all
                </button>
              </div>
            </div>
            <div className="flex gap-1">
              {['all', 'unread'].map((f) => (
                <button
                  key={f}
                  onClick={() => setDropdownFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    dropdownFilter === f
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {f === 'all' ? 'All' : 'Unread'}
                </button>
              ))}
            </div>
          </div>

          <OverlayScrollbarsComponent
            defer
            options={{ scrollbars: { autoHide: 'leave', autoHideDelay: 300 }, overflow: { x: 'hidden', y: 'scroll' } }}
            className="flex-1 min-h-0"
          >
            {dropdownLoading && filteredDropdownNotifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={28} strokeWidth={1.8} className="text-primary animate-spin" />
              </div>
            ) : filteredDropdownNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <BellOff size={32} strokeWidth={1.5} className="text-on-surface-variant/40 mb-2" />
                <p className="text-sm text-on-surface-variant">No notifications</p>
              </div>
            ) : (
              <div className="py-1">
                {filteredDropdownNotifications.map((n) => (
                  <NotificationItem key={n._id} n={n} onClick={handleNotificationClick} onArchive={handleArchive} onDelete={handleDelete} showActions={false} />
                ))}
              </div>
            )}
          </OverlayScrollbarsComponent>
        </div>
      )}

      {showAll && createPortal(
        <ModalShell
          title="All Notifications"
          icon={Bell}
          onClose={() => setShowAll(false)}
          maxWidth="max-w-2xl"
          footer={
            <div className="flex flex-wrap justify-between gap-2">
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="px-4 py-2.5 rounded-full bg-surface text-on-surface hover:bg-surface-container-high border border-outline-variant/30 transition-colors font-item-title text-item-title flex items-center gap-1.5"
                  >
                    <CheckCheck size={16} strokeWidth={1.8} /> Mark all read
                  </button>
                )}
                <button
                  onClick={handleArchiveAllRead}
                  className="px-4 py-2.5 rounded-full bg-surface text-on-surface hover:bg-surface-container-high border border-outline-variant/30 transition-colors font-item-title text-item-title flex items-center gap-1.5"
                >
                  <Archive size={16} strokeWidth={1.8} /> Archive read
                </button>
              </div>
              <span className="text-sm text-on-surface-variant self-center">
                {modalMeta.total} notification{modalMeta.total !== 1 ? 's' : ''} · {unreadCount} unread
              </span>
            </div>
          }
        >
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <select
              value={modalCategory}
              onChange={(e) => { setModalCategory(e.target.value); setModalPage(1); }}
              className="px-3 py-2 rounded-full bg-surface border border-outline-variant/30 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={modalPriority}
              onChange={(e) => { setModalPriority(e.target.value); setModalPage(1); }}
              className="px-3 py-2 rounded-full bg-surface border border-outline-variant/30 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <div className="flex gap-1 ml-auto">
              {['all', 'unread', 'read'].map((f) => (
                <button
                  key={f}
                  onClick={() => { setModalReadFilter(f); setModalPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    modalReadFilter === f ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : 'Read'}
                </button>
              ))}
            </div>
          </div>

          {modalLoading && modalNotifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={28} strokeWidth={1.8} className="text-primary animate-spin" />
            </div>
          ) : modalNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BellOff size={40} strokeWidth={1.5} className="text-on-surface-variant/30 mb-3" />
              <p className="text-on-surface-variant">No notifications found</p>
              <p className="text-on-surface-variant/60 text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="bg-surface rounded-xl border border-outline-variant/10 overflow-hidden">
              <div className="divide-y divide-outline-variant/10">
                {modalNotifications.map((n) => (
                  <NotificationItem
                    key={n._id}
                    n={n}
                    onClick={handleModalNotificationClick}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                    showActions
                  />
                ))}
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setModalPage((p) => Math.max(1, p - 1))}
                disabled={modalPage === 1}
                className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} strokeWidth={1.8} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - modalPage) <= 1)
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
                      onClick={() => setModalPage(p)}
                      className={`h-9 w-9 rounded-full text-sm font-semibold transition-colors ${
                        modalPage === p ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
              <button
                onClick={() => setModalPage((p) => Math.min(totalPages, p + 1))}
                disabled={modalPage === totalPages}
                className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} strokeWidth={1.8} />
              </button>
            </div>
          )}
        </ModalShell>
      , document.body)}
    </div>
  );
}
