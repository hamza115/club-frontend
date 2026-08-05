import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import AppLayout from '../components/AppLayout';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { useSocket } from '../context/SocketContext';
import { formatCurrency } from '../lib/currency';
import { Timer, Eye, List, Loader2 } from 'lucide-react';

const STATUS_TABS = [
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' },
  { label: 'All', value: '' },
];

function SessionTimer({ session }) {
  const { formatted, isRunning } = useSessionTimer(session);
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-live-indicator animate-pulse' : 'bg-warn'}`} />
      <span className="font-item-title text-item-title text-data">{formatted}</span>
    </div>
  );
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + formatTime(dateStr);
}

function SessionCard({ session, onView }) {
  const customer = session.customer || {};
  const table = session.table || {};
  const isActive = session.status === 'active' || session.status === 'paused';
  const isCompleted = session.status === 'completed';

  return (
    <div className="bg-paper rounded-[18px] p-4 md:p-5 border border-outline-variant/20 flex flex-col hover:shadow-lg transition-shadow duration-300">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${
            isActive ? 'bg-data-tint text-data' : 'bg-surface-container-high text-on-surface-variant'
          }`}>
            <Timer size={22} strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-item-title text-item-title text-on-surface leading-tight truncate">
              Table {String(table.tableNumber || '').padStart(2, '0')}
            </h3>
            <p className="font-caption text-caption text-on-surface-variant truncate">
              {customer.name || 'Guest'}{customer.phone ? ` • ${customer.phone}` : ''}
            </p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full font-item-title text-xs capitalize shrink-0 ${
          session.status === 'active' ? 'bg-good-tint text-good' :
          session.status === 'paused' ? 'bg-warn-tint text-warn' :
          session.status === 'completed' ? 'bg-surface-container-high text-on-surface-variant' :
          'bg-surface-container-high text-on-surface-variant'
        }`}>
          {session.status}
        </span>
      </div>

      {/* Session details */}
      <div className="bg-surface rounded-xl p-4 mb-4 flex-1 space-y-3">
        {isActive && (
          <div className="flex items-center justify-between">
            <span className="font-body text-body text-on-surface-variant">Time Elapsed</span>
            <SessionTimer session={session} />
          </div>
        )}

        {isCompleted && session.totalPlayingTime != null && (
          <div className="flex items-center justify-between">
            <span className="font-body text-body text-on-surface-variant">Playing Time</span>
            <span className="font-item-title text-item-title text-on-surface">
              {formatDuration(session.totalPlayingTime)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="font-body text-body text-on-surface-variant">Pricing</span>
          <span className="font-item-title text-item-title text-on-surface capitalize">
            {session.pricingMethod === 'hourly'
              ? 'Hourly'
              : session.pricingMethod === 'per_minute'
              ? 'Per Minute'
              : session.pricingMethod === 'frame'
              ? 'Per Frame'
              : 'Custom'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-body text-body text-on-surface-variant">Rate</span>
          <span className="font-item-title text-item-title text-on-surface">
            {session.pricingMethod === 'hourly'
              ? `${formatCurrency(session.hourlyRate || 0)} / hr`
              : session.pricingMethod === 'per_minute'
              ? `${formatCurrency(session.perMinuteRate || 0)} / min`
              : session.pricingMethod === 'frame'
              ? `${formatCurrency(session.frameRate || 0)} / frame`
              : `${formatCurrency(session.customRate || 0)}`}
          </span>
        </div>

        {isActive && (
          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
            <span className="font-body text-body text-on-surface-variant">Current Bill</span>
            <span className="font-item-title text-item-title text-on-surface text-lg">{formatCurrency(session.runningCharges || 0)}</span>
          </div>
        )}

        {isCompleted && (
          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
            <span className="font-body text-body text-on-surface-variant">Total</span>
            <span className="font-item-title text-item-title text-on-surface text-lg">{formatCurrency(session.finalAmount || 0)}</span>
          </div>
        )}

        {isCompleted && session.paymentStatus && (
          <div className="flex items-center justify-between">
            <span className="font-body text-body text-on-surface-variant">Payment</span>
            <span className={`px-2.5 py-0.5 rounded-full font-caption text-xs font-bold capitalize ${
              session.paymentStatus === 'paid' ? 'bg-good-tint text-good' : 'bg-warn-tint text-warn'
            }`}>
              {session.paymentStatus}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onView(session._id)}
          aria-label="View session"
          title="View session"
          className={`w-full px-4 py-2.5 rounded-full font-item-title text-item-title flex justify-center items-center transition-colors ${
            isActive
              ? 'bg-ink-raised text-paper hover:bg-primary'
              : 'bg-surface text-on-surface hover:bg-surface-container-high'
          }`}
        >
          <Eye size={18} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}

function CompletedGroupCard({ group, onView }) {
  const parentSession = group.sessions[group.sessions.length - 1] || group.sessions[0] || {};
  const table = parentSession.table || {};
  const customer = parentSession.customer || {};
  const unitLabel = parentSession.pricingMethod === 'frame' ? 'Frame' : 'Session';
  const pricingLabel =
    parentSession.pricingMethod === 'frame'
      ? 'Frame'
      : parentSession.pricingMethod === 'per_minute'
      ? 'Per Minute'
      : parentSession.pricingMethod === 'hourly'
      ? 'Hourly'
      : 'Custom';

  return (
    <div className="bg-paper rounded-[18px] p-4 md:p-5 border border-outline-variant/20 flex flex-col hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4 gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-11 w-11 rounded-full flex items-center justify-center shrink-0 bg-surface-container-high text-on-surface-variant">
            <List size={22} strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-item-title text-item-title text-on-surface leading-tight truncate">
              Table {String(table.tableNumber || '').padStart(2, '0')}
            </h3>
            <p className="font-caption text-caption text-on-surface-variant truncate">
              {customer.name || 'Guest'}
              {customer.phone ? ` • ${customer.phone}` : ''}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full font-item-title text-xs shrink-0 bg-surface-container-high text-on-surface-variant">
          {group.sessions.length} {unitLabel.toLowerCase()}{group.sessions.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-surface rounded-xl p-4 mb-4 flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-body text-body text-on-surface-variant">Status</span>
          <span className="px-2.5 py-0.5 rounded-full font-caption text-xs font-bold capitalize bg-surface-container-high text-on-surface-variant">
            Completed
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body text-body text-on-surface-variant">Type</span>
          <span className="px-2.5 py-0.5 rounded-full font-caption text-xs font-bold capitalize bg-data-tint text-data">
            {pricingLabel}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body text-body text-on-surface-variant">Playing Time</span>
          <span className="font-item-title text-item-title text-on-surface">
            {formatDuration(group.totalPlayingTime)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body text-body text-on-surface-variant">Table Charges</span>
          <span className="font-item-title text-item-title text-on-surface">{formatCurrency(group.totalTableCharges)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body text-body text-on-surface-variant">Cafe Charges</span>
          <span className="font-item-title text-item-title text-on-surface">{formatCurrency(group.totalCafeCharges)}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
          <span className="font-body text-body text-on-surface-variant">Total</span>
          <span className="font-item-title text-item-title text-on-surface text-lg">{formatCurrency(group.totalAmount)}</span>
        </div>

        <div className="pt-2 border-t border-outline-variant/20 space-y-2">
          <p className="font-caption text-caption text-on-surface-variant uppercase font-bold tracking-widest">
            Visit {unitLabel}s
          </p>
          <div className="space-y-2">
            {group.sessions.map((session, index) => (
              <div key={session._id} className="flex items-center justify-between gap-3 rounded-lg bg-paper px-3 py-2">
                <div className="min-w-0">
                  <p className="font-item-title text-item-title text-on-surface">
                    {unitLabel} {index + 1}
                  </p>
                  <p className="font-caption text-caption text-on-surface-variant">
                    {formatDuration(session.totalPlayingTime)} • {formatDateTime(session.startTime)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-item-title text-item-title text-on-surface">{formatCurrency(session.finalAmount || 0)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Group-level payment summary */}
          {(() => {
            const totalPaid = group.sessions.reduce((sum, s) => sum + (s.amountPaid || 0), 0);
            const leftover = Math.max(0, group.totalAmount - totalPaid);
            const allPaid = group.sessions.every((s) => s.paymentStatus === 'paid');
            if (allPaid) return null;
            return (
              <div className="mt-2 pt-2 border-t border-outline-variant/10 space-y-1">
                {totalPaid > 0 && (
                  <div className="flex justify-between">
                    <span className="font-caption text-caption text-good">Amount Paid</span>
                    <span className="font-caption text-caption text-good">{formatCurrency(totalPaid)}</span>
                  </div>
                )}
                {leftover > 0 && (
                  <div className="flex justify-between">
                    <span className="font-caption text-caption text-warn font-semibold">Leftover (Udhar)</span>
                    <span className="font-caption text-caption text-warn font-semibold">{formatCurrency(leftover)}</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onView(parentSession._id)}
          aria-label="View session"
          title="View session"
          className="w-full px-4 py-2.5 rounded-full font-item-title text-item-title flex justify-center items-center transition-colors bg-surface text-on-surface hover:bg-surface-container-high"
        >
          <Eye size={18} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}

function groupCompletedSessions(sessions) {
  const groups = new Map();

  for (const session of sessions) {
    const key = session.groupId || session._id;
    const createdAt = session.createdAt ? new Date(session.createdAt).getTime() : 0;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        groupId: session.groupId || null,
        sessions: [],
        sortTime: createdAt,
      });
    }

    const group = groups.get(key);
    group.sessions.push(session);
    group.sortTime = Math.max(group.sortTime, createdAt);
  }

  return Array.from(groups.values())
    .sort((a, b) => b.sortTime - a.sortTime)
    .map((group) => {
      const sortedSessions = [...group.sessions].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const totals = sortedSessions.reduce(
        (acc, session) => {
          acc.totalPlayingTime += session.totalPlayingTime || 0;
          acc.totalTableCharges += session.tableCharges || 0;
          acc.totalCafeCharges += session.cafeCharges || 0;
          acc.totalDiscount += session.discount || 0;
          acc.totalAmount += session.finalAmount || 0;
          acc.totalPaid += session.amountPaid || 0;
          return acc;
        },
        {
          totalPlayingTime: 0,
          totalTableCharges: 0,
          totalCafeCharges: 0,
          totalDiscount: 0,
          totalAmount: 0,
          totalPaid: 0,
        }
      );

      return {
        ...group,
        sessions: sortedSessions,
        ...totals,
      };
    });
}

function buildAllTabItems(sessions) {
  const completedGroups = groupCompletedSessions(sessions.filter((session) => session.status === 'completed'));
  const groupedSessionIds = new Set(
    completedGroups.flatMap((group) => group.sessions.map((session) => String(session._id)))
  );

  const remainingSessions = sessions.filter(
    (session) => session.status !== 'completed' || !groupedSessionIds.has(String(session._id))
  );

  const items = [
    ...completedGroups.map((group) => ({
      type: 'group',
      key: `group-${group.key}`,
      sortTime: group.sortTime,
      group,
    })),
    ...remainingSessions.map((session) => ({
      type: 'session',
      key: `session-${session._id}`,
      sortTime: session.createdAt ? new Date(session.createdAt).getTime() : 0,
      session,
    })),
  ];

  return items.sort((a, b) => b.sortTime - a.sortTime);
}

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [tab, setTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { on, off } = useSocket();

  function fetchActiveSessions() {
    api.get('/sessions/active')
      .then((res) => setActiveSessions(res.data.data || []))
      .catch(() => setActiveSessions([]));
  }

  function fetchSessions(status) {
    setLoading(true);
    const params = { limit: 100 };
    if (status) params.status = status;

    api.get('/sessions', { params })
      .then((res) => {
        const data = res.data.data;
        // paginated response returns array directly in data
        setSessions(Array.isArray(data) ? data : (data.sessions || []));
      })
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchActiveSessions();
  }, []);

  useEffect(() => {
    if (tab === 'active') {
      fetchActiveSessions();
      setLoading(false);
    } else if (tab === 'paused') {
      setLoading(false);
    } else {
      fetchSessions(tab);
    }
  }, [tab]);

  // Socket event handlers
  const handleSessionStarted = useCallback((data) => {
    setActiveSessions((prev) => {
      if (prev.some((s) => String(s._id) === String(data.session._id))) return prev;
      return [data.session, ...prev];
    });
  }, []);

  const handleSessionPaused = useCallback((data) => {
    setActiveSessions((prev) =>
      prev.map((s) =>
        String(s._id) === String(data.sessionId) ? { ...s, status: 'paused', pausedAt: data.pausedAt } : s
      )
    );
  }, []);

  const handleSessionResumed = useCallback((data) => {
    setActiveSessions((prev) =>
      prev.map((s) =>
        String(s._id) === String(data.sessionId)
          ? { ...s, status: 'active', pausedAt: null, totalPausedDuration: data.totalPausedDuration }
          : s
      )
    );
  }, []);

  const handleSessionEnded = useCallback((data) => {
    setActiveSessions((prev) => prev.filter((s) => String(s._id) !== String(data.sessionId)));
    if (tab === 'completed') fetchSessions('completed');
  }, [tab]);

  const handleSessionUpdated = useCallback((data) => {
    setActiveSessions((prev) =>
      prev.map((s) =>
        String(s._id) === String(data.sessionId) ? { ...s, cafeCharges: data.cafeCharges } : s
      )
    );
  }, []);

  useEffect(() => {
    on('session:started', handleSessionStarted);
    on('session:paused', handleSessionPaused);
    on('session:resumed', handleSessionResumed);
    on('session:ended', handleSessionEnded);
    on('session:updated', handleSessionUpdated);

    return () => {
      off('session:started', handleSessionStarted);
      off('session:paused', handleSessionPaused);
      off('session:resumed', handleSessionResumed);
      off('session:ended', handleSessionEnded);
      off('session:updated', handleSessionUpdated);
    };
  }, [on, off, handleSessionStarted, handleSessionPaused, handleSessionResumed, handleSessionEnded, handleSessionUpdated]);

  const completedGroups = tab === 'completed' ? groupCompletedSessions(sessions) : [];
  const completedDisplaySessions = tab === 'completed'
    ? (completedGroups.length > 0 ? completedGroups : sessions)
    : [];
  const allTabItems = tab === '' ? buildAllTabItems(sessions) : [];

  // Active tab shows both active + paused (occupied tables)
  // Paused tab shows only paused sessions from active list
  const displaySessions = tab === 'active'
    ? activeSessions
    : tab === 'paused'
      ? activeSessions.filter((s) => s.status === 'paused')
      : tab === 'completed'
        ? completedGroups
        : allTabItems;

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="flex flex-col gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="font-headline text-headline-mobile md:text-headline text-on-background">Sessions</h2>
          <p className="font-body text-body text-on-surface-variant mt-1">Track active sessions and billing history.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-3 md:px-4 py-2 rounded-full font-item-title text-item-title transition-colors ${
                tab === t.value
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {t.label}
              {t.value === 'active' && activeSessions.length > 0 && (
                <span className="ml-1.5 w-5 h-5 rounded-full bg-on-primary/20 text-on-primary text-[11px] inline-flex items-center justify-center">
                  {activeSessions.length}
                </span>
              )}
              {t.value === 'paused' && activeSessions.filter((s) => s.status === 'paused').length > 0 && (
                <span className="ml-1.5 w-5 h-5 rounded-full bg-on-primary/20 text-on-primary text-[11px] inline-flex items-center justify-center">
                  {activeSessions.filter((s) => s.status === 'paused').length}
                </span>
              )}
              {t.value === 'completed' && tab === 'completed' && sessions.length > 0 && (
                <span className="ml-1.5 w-5 h-5 rounded-full bg-on-primary/20 text-on-primary text-[11px] inline-flex items-center justify-center">
                  {completedDisplaySessions.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loading or Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} strokeWidth={1.5} className="animate-spin text-on-surface-variant" />
        </div>
        ) : displaySessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Timer size={32} strokeWidth={1.5} className="text-on-surface-variant mb-4" />
          <p className="font-body text-body text-on-surface-variant">
            {tab === 'active' ? 'No active sessions' : tab === 'paused' ? 'No paused sessions' : 'No sessions found'}
          </p>
        </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {tab === 'completed'
              ? completedGroups.length > 0
                ? completedGroups.map((group) => (
                    <CompletedGroupCard
                      key={group.key}
                      group={group}
                      onView={(id) => navigate(`/sessions/${id}`)}
                    />
                  ))
                : sessions.map((session) => (
                    <SessionCard
                      key={session._id}
                      session={session}
                      onView={(id) => navigate(`/sessions/${id}`)}
                    />
                  ))
              : tab === ''
                ? allTabItems.map((item) =>
                    item.type === 'group' ? (
                      <CompletedGroupCard
                        key={item.key}
                        group={item.group}
                        onView={(id) => navigate(`/sessions/${id}`)}
                      />
                    ) : (
                      <SessionCard
                        key={item.key}
                        session={item.session}
                        onView={(id) => navigate(`/sessions/${id}`)}
                      />
                    )
                  )
                : displaySessions.map((session) => (
                    <SessionCard
                      key={session._id}
                      session={session}
                      onView={(id) => navigate(`/sessions/${id}`)}
                    />
                  ))}
          </div>
        )}
      </AppLayout>
  );
}
