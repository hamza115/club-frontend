import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import AppLayout from '../components/AppLayout';
import StartSessionModal from '../components/StartSessionModal';
import SessionCafeModal from '../components/SessionCafeModal';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/useAuth';
import { formatCurrency } from '../lib/currency';
import {
  CircleDot, Clock, Eye, Coffee, Pause, Play,
  CheckCheck, Loader2, Armchair, Calendar, Wrench
} from 'lucide-react';

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Available', value: 'available' },
  { label: 'Occupied', value: 'occupied' },
  { label: 'Reserved', value: 'reserved' },
  { label: 'Maintenance', value: 'maintenance' },
];

const STATUS_STYLES = {
  occupied: { icon: 'bg-data-tint text-data', badge: 'bg-data-tint text-data', border: 'border-data-tint' },
  available: { icon: 'bg-good-tint text-good', badge: 'bg-good-tint text-good', border: 'border-good-tint' },
  reserved: { icon: 'bg-warn-tint text-warn', badge: 'bg-warn-tint text-warn', border: 'border-warn-tint' },
  maintenance: { icon: 'bg-surface-container-high text-on-surface-variant', badge: 'bg-surface-container-high text-on-surface-variant', border: 'border-surface-container' },
};

function TimerDisplay({ session }) {
  const { formatted } = useSessionTimer(session);
  return <span className="font-item-title text-item-title">{formatted}</span>;
}

function LiveCharge({ session }) {
  const { elapsed } = useSessionTimer(session);
  const hours = Math.max(0, elapsed / (1000 * 60 * 60));
  const minutes = Math.max(0, elapsed / (1000 * 60));

  let charges = 0;
  if (session.pricingMethod === 'hourly') {
    charges = Math.floor(hours * (session.hourlyRate || 0));
  } else if (session.pricingMethod === 'per_minute') {
    charges = Math.floor(minutes * (session.perMinuteRate || 0));
  } else {
    charges = (session.totalFrames || 0) * (session.frameRate || 0);
  }

  return <span className="font-item-title text-item-title text-on-surface text-lg">{formatCurrency(charges)}</span>;
}

function TableCard({
  table,
  onStartSession,
  onViewSession,
  onPauseSession,
  onResumeSession,
  onEndSession,
  onCafeSession,
  canManageActions = true,
  actionLoading = {},
}) {
  const s = table.status;
  const style = STATUS_STYLES[s] || STATUS_STYLES.available;
  const session = table.currentSession || {};
  const customer = session.customer || {};
  const isFrameMode = session.pricingMethod === 'frame';
  const isSessionPaused = session.status === 'paused';
  const isSessionActive = session.status === 'active';
  const isActionBusy = !!actionLoading[session._id];
  const isAwaitingCheckout = Boolean(table.currentGroupId && !session._id);
  const inProgressLabel = isAwaitingCheckout || isFrameMode ? 'Frame in progress' : 'Session in progress';

  return (
    <div className="bg-paper rounded-[18px] p-4 md:p-5 border border-outline-variant/20 flex flex-col h-full hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`h-11 w-11 rounded-full ${style.icon} flex items-center justify-center shrink-0`}>
            <CircleDot className="w-[26px] h-[26px] shrink-0" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-title text-title text-on-surface leading-tight truncate">Table {String(table.tableNumber).padStart(2, '0')}</h3>
            <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-on-surface-variant font-caption mt-0.5">
              <span className="whitespace-nowrap">{formatCurrency(table.hourlyRate || 0)}/hr</span>
              <span className="opacity-40">•</span>
              <span className="whitespace-nowrap">{formatCurrency(table.frameRate || '—')}/frame</span>
              {table.perMinuteRate > 0 && (
                <>
                  <span className="opacity-40">•</span>
                  <span className="whitespace-nowrap">{formatCurrency(table.perMinuteRate)}/min</span>
                </>
              )}
            </div>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full ${style.badge} font-item-title text-xs capitalize shrink-0`}>
          {s}
        </span>
      </div>

      {/* Body */}
      {s === 'occupied' && session._id && (
        <div className="bg-surface rounded-xl p-4 mb-6 flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-body text-body text-on-surface-variant">Customer</span>
            <span className="font-item-title text-item-title text-on-surface">{customer.name || 'Guest'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body text-body text-on-surface-variant">Time Elapsed</span>
            <div className="flex items-center gap-2 text-data">
              <Clock className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
              <TimerDisplay session={session} />
            </div>
          </div>
          {isSessionPaused && (
            <div className="flex items-center justify-between">
              <span className="font-body text-body text-on-surface-variant">Status</span>
              <span className="px-2.5 py-1 rounded-full bg-warn-tint text-warn font-caption text-xs font-bold uppercase">Paused</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
            <span className="font-body text-body text-on-surface-variant">Current Bill</span>
            <LiveCharge session={session} />
          </div>
        </div>
      )}

      {s === 'occupied' && !session._id && (
        <div className="bg-surface rounded-xl p-4 mb-6 flex-1 flex flex-col justify-center items-center text-center opacity-70 border border-dashed border-outline-variant/40">
          <CircleDot size={18} strokeWidth={1.5} className="text-on-surface-variant mb-2" />
          <p className="font-body text-body text-on-surface-variant">{inProgressLabel}</p>
        </div>
      )}

      {s === 'available' && (
        <div className="bg-surface rounded-xl p-4 mb-6 flex-1 flex flex-col justify-center items-center text-center opacity-70 border border-dashed border-outline-variant/40">
          <Armchair size={18} strokeWidth={1.5} className="text-on-surface-variant mb-2" />
          <p className="font-body text-body text-on-surface-variant">Ready for new session</p>
          <p className="font-caption text-caption text-on-surface-variant mt-1">Cleaned and ready</p>
        </div>
      )}

      {s === 'reserved' && (
        <div className="bg-surface rounded-xl p-4 mb-6 flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-body text-body text-on-surface-variant">Reserved For</span>
            <span className="font-item-title text-item-title text-on-surface">{customer.name || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body text-body text-on-surface-variant">Time</span>
            <div className="flex items-center gap-2 text-warn">
              <Calendar size={16} strokeWidth={1.8} />
              <span className="font-item-title text-item-title">—</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
            <span className="font-body text-body text-on-surface-variant">Notes</span>
            <span className="font-caption text-caption text-on-surface-variant text-right">{table.notes || '—'}</span>
          </div>
        </div>
      )}

      {s === 'maintenance' && (
        <div className="bg-surface rounded-xl p-4 mb-6 flex-1 flex flex-col justify-center items-center text-center opacity-70 border border-dashed border-outline-variant/40">
          <Wrench size={18} strokeWidth={1.5} className="text-on-surface-variant mb-2" />
          <p className="font-body text-body text-on-surface-variant">Under maintenance</p>
          <p className="font-caption text-caption text-on-surface-variant mt-1">{table.notes || 'Temporarily unavailable'}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-auto">
        {s === 'occupied' && session._id && (
          <>
            <button
              onClick={() => onViewSession(session._id)}
              className="flex-1 min-w-[70px] px-2 sm:px-4 py-2.5 rounded-full bg-surface text-on-surface hover:bg-surface-container-high transition-colors font-item-title text-item-title flex justify-center items-center gap-1 sm:gap-2"
            >
              <Eye className="w-5 h-5 shrink-0" strokeWidth={1.8} /> <span className="hidden xs:inline sm:inline">View</span>
            </button>
            {canManageActions && (
              <>
                <button
                  onClick={() => onCafeSession(session._id)}
                  className="flex-1 min-w-[70px] px-2 sm:px-4 py-2.5 rounded-full bg-surface text-on-surface hover:bg-surface-container-high transition-colors font-item-title text-item-title flex justify-center items-center gap-1 sm:gap-2"
                >
                  <Coffee className="w-5 h-5 shrink-0" strokeWidth={1.8} /> <span className="hidden xs:inline sm:inline">Cafe</span>
                </button>
                {/* Frame complete / session stop button */}
                {isSessionActive && !isFrameMode && (
                  <button
                    type="button"
                    onClick={() => onPauseSession(session._id)}
                    disabled={isActionBusy}
                    className="flex-1 min-w-[70px] px-2 sm:px-4 py-2.5 rounded-full bg-ink-raised text-paper hover:bg-primary transition-colors font-item-title text-item-title flex justify-center items-center gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Pause className="w-5 h-5 shrink-0" strokeWidth={1.8} /> <span className="hidden xs:inline sm:inline">Stop</span>
                  </button>
                )}
                {isFrameMode && (
                  <button
                    type="button"
                    onClick={() => onEndSession(session._id, session)}
                    disabled={isActionBusy}
                    className="w-11 h-11 rounded-full bg-ink-raised text-paper hover:bg-primary transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    title="Complete Frame"
                    aria-label="Complete Frame"
                  >
                    {isActionBusy ? (
                      <Loader2 size={18} strokeWidth={1.8} className="animate-spin" />
                    ) : (
                      <CheckCheck size={18} strokeWidth={1.8} />
                    )}
                  </button>
                )}
              </>
            )}
          </>
        )}
        {s === 'occupied' && !session._id && (
          <>
            <button
              onClick={() => onViewSession(null, table.currentGroupId)}
              className="flex-1 min-w-[70px] px-2 sm:px-4 py-2.5 rounded-full bg-surface text-on-surface hover:bg-surface-container-high transition-colors font-item-title text-item-title flex justify-center items-center gap-1 sm:gap-2"
            >
              <Eye size={18} strokeWidth={1.8} /> <span className="hidden xs:inline sm:inline">View</span>
            </button>
            {canManageActions && (
              <button
                onClick={() => onCafeSession(null, table.currentGroupId)}
                className="flex-1 min-w-[70px] px-2 sm:px-4 py-2.5 rounded-full bg-surface text-on-surface hover:bg-surface-container-high transition-colors font-item-title text-item-title flex justify-center items-center gap-1 sm:gap-2"
              >
                <Coffee size={18} strokeWidth={1.8} /> <span className="hidden xs:inline sm:inline">Cafe</span>
              </button>
            )}
          </>
        )}
        {s === 'available' && canManageActions && (
          <button
            onClick={() => onStartSession(table)}
            className="w-full px-4 py-3 rounded-full bg-ink-raised text-paper hover:bg-primary transition-colors font-item-title text-item-title flex justify-center items-center gap-2"
          >
            <Play className="w-5 h-5 shrink-0" strokeWidth={1.8} /> Start Session
          </button>
        )}
        {s === 'available' && !canManageActions && (
          <div className="w-full px-4 py-3 rounded-full bg-surface text-on-surface-variant text-center font-item-title text-item-title">
            Read-only access
          </div>
        )}
        {s === 'reserved' && canManageActions && (
          <>
            <button className="flex-1 min-w-[70px] px-2 sm:px-4 py-2.5 rounded-full bg-surface text-on-surface hover:bg-surface-container-high transition-colors font-item-title text-item-title flex justify-center items-center gap-1 sm:gap-2">
              Details
            </button>
            <button className="flex-1 min-w-[70px] px-2 sm:px-4 py-2.5 rounded-full bg-ink-raised text-paper hover:bg-primary transition-colors font-item-title text-item-title flex justify-center items-center gap-1 sm:gap-2">
              Check In
            </button>
          </>
        )}
        {s === 'reserved' && !canManageActions && (
          <div className="w-full px-4 py-3 rounded-full bg-surface text-on-surface-variant text-center font-item-title text-item-title">
            Read-only access
          </div>
        )}
        {s === 'maintenance' && canManageActions && (
          <button className="w-full px-4 py-3 rounded-full bg-surface text-on-surface hover:bg-surface-container-high transition-colors font-item-title text-item-title flex justify-center items-center gap-2">
            Mark Available
          </button>
        )}
        {s === 'maintenance' && !canManageActions && (
          <div className="w-full px-4 py-3 rounded-full bg-surface text-on-surface-variant text-center font-item-title text-item-title">
            Read-only access
          </div>
        )}
      </div>
    </div>
  );
}

function LiveTablePanel({ tables }) {
  const available = tables.filter((t) => t.status === 'available').length;
  const occupied = tables.filter((t) => t.status === 'occupied').length;

  return (
    <div className="bg-paper rounded-[18px] p-4 md:p-5 border border-outline-variant/20 flex flex-col h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-item-title text-item-title text-on-surface">Live Status</h3>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-good-tint text-good font-caption text-caption">
          <span className="w-2 h-2 rounded-full bg-live-indicator animate-pulse" />
          Live
        </span>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-good-tint/50 rounded-xl p-3 text-center">
          <p className="font-title text-title text-good">{available}</p>
          <p className="font-caption text-caption text-good">Available</p>
        </div>
        <div className="bg-data-tint/50 rounded-xl p-3 text-center">
          <p className="font-title text-title text-data">{occupied}</p>
          <p className="font-caption text-caption text-data">Occupied</p>
        </div>
      </div>

      {/* Table list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {tables.map((t) => {
          const isActive = t.status === 'occupied';
          const session = t.currentSession || {};
          const customer = session.customer || {};
          const isPaused = session.status === 'paused';

          return (
            <div
              key={t._id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isActive
                ? 'bg-data-tint/30 border-data-tint/50'
                : t.status === 'maintenance'
                  ? 'bg-surface border-outline-variant/20 opacity-60'
                  : 'bg-surface border-outline-variant/20'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isActive && !isPaused ? 'bg-live-indicator animate-pulse' : isActive && isPaused ? 'bg-warn' : t.status === 'maintenance' ? 'bg-on-surface-variant' : 'bg-good'
                  }`} />
                <div className="min-w-0">
                  <p className="font-item-title text-item-title text-on-surface truncate">
                    T-{String(t.tableNumber).padStart(2, '0')}
                  </p>
                  {isActive && customer.name && (
                    <p className="font-caption text-caption text-on-surface-variant truncate">
                      {customer.name} {isPaused ? '• Paused' : ''}
                    </p>
                  )}
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full font-caption text-[11px] capitalize shrink-0 ${isActive && isPaused ? 'bg-warn-tint text-warn' :
                isActive ? 'bg-data-tint text-data' :
                  t.status === 'maintenance' ? 'bg-surface-container-high text-on-surface-variant' : 'bg-good-tint text-good'
                }`}>
                {isPaused ? 'paused' : t.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [startModal, setStartModal] = useState(null);
  const [cafeModal, setCafeModal] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const navigate = useNavigate();
  const { on, off } = useSocket();
  const { user } = useAuth();
  const canManageActions = user?.role !== 'super_admin';

  function fetchTables() {
    api.get('/tables')
      .then((res) => setTables(res.data.data.tables || []))
      .catch(() => setTables([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchTables();
  }, []);

  // Socket event handlers — refresh tables when sessions change
  const handleSessionStarted = useCallback(() => {
    fetchTables();
  }, []);

  const handleSessionEnded = useCallback(() => {
    fetchTables();
  }, []);

  const handleSessionPaused = useCallback((data) => {
    setTables((prev) =>
      prev.map((t) => {
        if (!t.currentSession || String(t.currentSession._id) !== String(data.sessionId)) return t;
        return {
          ...t,
          currentSession: { ...t.currentSession, status: 'paused', pausedAt: data.pausedAt },
        };
      })
    );
  }, []);

  const handleSessionResumed = useCallback((data) => {
    setTables((prev) =>
      prev.map((t) => {
        if (!t.currentSession || String(t.currentSession._id) !== String(data.sessionId)) return t;
        return {
          ...t,
          currentSession: {
            ...t.currentSession,
            status: 'active',
            pausedAt: null,
            totalPausedDuration: data.totalPausedDuration,
          },
        };
      })
    );
  }, []);

  const handleTableCreated = useCallback(() => {
    fetchTables();
  }, []);

  const handleTableUpdated = useCallback((data) => {
    setTables((prev) =>
      prev.map((t) => (String(t._id) === String(data.table?._id) ? { ...t, ...data.table } : t))
    );
  }, []);

  const handleTableDeleted = useCallback((data) => {
    setTables((prev) => prev.filter((t) => String(t._id) !== String(data.tableId)));
  }, []);

  useEffect(() => {
    on('session:started', handleSessionStarted);
    on('session:ended', handleSessionEnded);
    on('session:paused', handleSessionPaused);
    on('session:resumed', handleSessionResumed);
    on('table:created', handleTableCreated);
    on('table:updated', handleTableUpdated);
    on('table:deleted', handleTableDeleted);

    return () => {
      off('session:started', handleSessionStarted);
      off('session:ended', handleSessionEnded);
      off('session:paused', handleSessionPaused);
      off('session:resumed', handleSessionResumed);
      off('table:created', handleTableCreated);
      off('table:updated', handleTableUpdated);
      off('table:deleted', handleTableDeleted);
    };
  }, [on, off, handleSessionStarted, handleSessionEnded, handleSessionPaused, handleSessionResumed, handleTableCreated, handleTableUpdated, handleTableDeleted]);

  function onSessionStarted() {
    setStartModal(null);
    fetchTables();
  }

  async function handleViewSession(sessionId, groupId) {
    if (sessionId) {
      navigate(`/sessions/${sessionId}`);
    } else if (groupId) {
      // Occupied table with no active session — navigate to group's latest session
      try {
        const res = await api.get(`/sessions/group/${groupId}`);
        const sessions = res.data.data.sessions || [];
        const latest = sessions[sessions.length - 1];
        if (latest) navigate(`/sessions/${latest._id}`);
      } catch {
        navigate('/sessions');
      }
    } else {
      navigate('/sessions');
    }
  }

  async function handleCafeSession(sessionId, groupId) {
    let targetId = sessionId;
    if (!targetId && groupId) {
      try {
        const res = await api.get(`/sessions/group/${groupId}`);
        const sessions = res.data.data.sessions || [];
        const activeOrPaused = sessions.find((s) => s.status === 'active' || s.status === 'paused');
        const latest = activeOrPaused || sessions[sessions.length - 1];
        if (latest) targetId = latest._id;
      } catch {
        // fall through
      }
    }
    if (targetId) {
      setCafeModal(targetId);
    }
  }

  async function handlePauseSession(sessionId) {
    setActionLoading((prev) => ({ ...prev, [sessionId]: true }));
    try {
      await api.post(`/sessions/${sessionId}/pause`);
    } catch {
      // Socket will handle the UI update
    } finally {
      setActionLoading((prev) => ({ ...prev, [sessionId]: false }));
    }
  }

  async function handleEndSession(sessionId, session) {
    setActionLoading((prev) => ({ ...prev, [sessionId]: true }));
    try {
      await api.post(`/sessions/${sessionId}/end`, session?.pricingMethod === 'frame' ? { totalFrames: 1 } : {});
    } catch {
      // Socket will handle the UI update
    } finally {
      setActionLoading((prev) => ({ ...prev, [sessionId]: false }));
    }
  }

  async function handleResumeSession(sessionId) {
    setActionLoading((prev) => ({ ...prev, [sessionId]: true }));
    try {
      await api.post(`/sessions/${sessionId}/resume`);
    } catch {
      // Socket will handle the UI update
    } finally {
      setActionLoading((prev) => ({ ...prev, [sessionId]: false }));
    }
  }

  const filtered = filter
    ? tables.filter((t) => t.status === filter)
    : tables;

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="flex flex-col gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="font-headline text-headline-mobile md:text-headline text-on-background">Tables</h2>
          <p className="font-body text-body text-on-surface-variant mt-1">Manage active sessions and table availability.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 md:px-4 py-2 rounded-full font-item-title text-item-title transition-colors ${filter === f.value
                ? 'bg-primary text-on-primary'
                : 'bg-surface text-on-surface hover:bg-surface-container-high'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content with side panel */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Table Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={18} strokeWidth={1.5} className="animate-spin text-on-surface-variant" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CircleDot size={18} strokeWidth={1.5} className="text-on-surface-variant mb-4" />
              <p className="font-body text-body text-on-surface-variant">No tables found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {filtered.map((table) => (
                <TableCard
                  key={table._id}
                  table={table}
                  onStartSession={canManageActions ? setStartModal : undefined}
                  onViewSession={handleViewSession}
                  onPauseSession={handlePauseSession}
                  onResumeSession={handleResumeSession}
                  onEndSession={handleEndSession}
                  onCafeSession={handleCafeSession}
                  canManageActions={canManageActions}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </div>

        {/* Live Table Status Panel */}
        <div className="xl:w-[300px] shrink-0">
          <LiveTablePanel tables={tables} />
        </div>
      </div>

      {/* Start Session Modal */}
      {startModal && canManageActions && (
        <StartSessionModal
          table={startModal}
          onClose={() => setStartModal(null)}
          onStarted={onSessionStarted}
        />
      )}

      {/* Cafe Session Modal */}
      {cafeModal && (
        <SessionCafeModal
          sessionId={cafeModal}
          onClose={() => setCafeModal(null)}
          onItemsAdded={fetchTables}
        />
      )}
    </AppLayout>
  );
}
