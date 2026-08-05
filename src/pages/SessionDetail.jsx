import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import AppLayout from '../components/AppLayout';
import ConfirmModal from '../components/ConfirmModal';
import SessionCafeModal from '../components/SessionCafeModal';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/useAuth';
import { formatCurrency } from '../lib/currency';
import { useSettings } from '../context/SettingsContext';
import {
  ChevronLeft, Pause, Play, Coffee, Square, CheckCheck,
  PlusCircle, Timer, TimerOff, User, Eye, ChevronDown,
  CreditCard, CheckCircle2, Clock, X, Loader2, Receipt,
  Hourglass, Landmark, Smartphone
} from 'lucide-react';

function pricingLabel(method) {
  if (method === 'hourly') return 'Hourly';
  if (method === 'per_minute') return 'Per Minute';
  if (method === 'frame') return 'Per Frame';
  return 'Custom';
}

function rateDisplay(session) {
  if (session.pricingMethod === 'hourly') return `${formatCurrency(session.hourlyRate)} / hr`;
  if (session.pricingMethod === 'per_minute') return `${formatCurrency(session.perMinuteRate)} / min`;
  if (session.pricingMethod === 'frame') return `${formatCurrency(session.frameRate)} / frame`;
  return formatCurrency(session.customRate);
}

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [groupDiscount, setGroupDiscount] = useState('');
  const [groupDiscountReason, setGroupDiscountReason] = useState('');
  const [groupAmountPaid, setGroupAmountPaid] = useState('');
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showFinishGroupConfirm, setShowFinishGroupConfirm] = useState(false);
  const [showCafeModal, setShowCafeModal] = useState(false);
  const { on, off } = useSocket();
  const { user } = useAuth();
  const { currencyCode } = useSettings();
  const isAdmin = user?.role === 'super_admin';
  const canPerformActions = !isAdmin;

  function fetchSession() {
    api.get(`/sessions/${id}`)
      .then((res) => {
        const data = res.data.data;
        setSession(data);
        // If this session has a groupId, fetch the full table-visit chain
        if (data.session?.groupId) {
          fetchGroupData(data.session.groupId);
        }
      })
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }

  function fetchGroupData(groupId) {
    api.get(`/sessions/group/${groupId}`)
      .then((res) => setGroupData(res.data.data))
      .catch(() => setGroupData(null));
  }

  useEffect(() => {
    fetchSession();
  }, [id]);

  // Auto-refresh every 15s for active sessions
  useEffect(() => {
    if (!session?.session) return;
    const s = session.session;
    if (s.status !== 'active' && s.status !== 'paused') return;
    const interval = setInterval(fetchSession, 15000);
    return () => clearInterval(interval);
  }, [session?.session?.status]);

  // Socket event handlers
  const handleSocketPaused = useCallback((data) => {
    if (data.sessionId !== id) return;
    setSession((prev) => {
      if (!prev?.session) return prev;
      return {
        ...prev,
        session: { ...prev.session, status: 'paused', pausedAt: data.pausedAt },
        runningCharges: prev.runningCharges,
      };
    });
    if (session?.session?.groupId) fetchGroupData(session.session.groupId);
  }, [id, session?.session?.groupId]);

  const handleSocketResumed = useCallback((data) => {
    if (data.sessionId !== id) return;
    setSession((prev) => {
      if (!prev?.session) return prev;
      return {
        ...prev,
        session: {
          ...prev.session,
          status: 'active',
          pausedAt: null,
          totalPausedDuration: data.totalPausedDuration,
        },
        runningCharges: prev.runningCharges,
      };
    });
    if (session?.session?.groupId) fetchGroupData(session.session.groupId);
  }, [id, session?.session?.groupId]);

  const handleSocketEnded = useCallback((data) => {
    if (String(data.sessionId) !== String(id)) return;
    fetchSession();
  }, [id]);

  const handleSocketUpdated = useCallback((data) => {
    if (String(data.sessionId) !== String(id)) return;
    fetchSession();
  }, [id]);

  const handleGroupFinished = useCallback((data) => {
    if (data.groupId !== session?.session?.groupId) return;
    fetchSession();
  }, [session?.session?.groupId]);

  useEffect(() => {
    on('session:paused', handleSocketPaused);
    on('session:resumed', handleSocketResumed);
    on('session:ended', handleSocketEnded);
    on('session:updated', handleSocketUpdated);
    on('group:finished', handleGroupFinished);

    return () => {
      off('session:paused', handleSocketPaused);
      off('session:resumed', handleSocketResumed);
      off('session:ended', handleSocketEnded);
      off('session:updated', handleSocketUpdated);
      off('group:finished', handleGroupFinished);
    };
  }, [on, off, handleSocketPaused, handleSocketResumed, handleSocketEnded, handleSocketUpdated, handleGroupFinished]);

  async function handlePause() {
    if (!canPerformActions) return;
    setActionLoading(true);
    try {
      await api.post(`/sessions/${id}/pause`);
      fetchSession();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to pause session');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResume() {
    if (!canPerformActions) return;
    setActionLoading(true);
    try {
      await api.post(`/sessions/${id}/resume`);
      fetchSession();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resume session');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEndSession() {
    if (!canPerformActions) return;
    setActionLoading(true);
    try {
      await api.post(`/sessions/${id}/end`, isFrameMode ? { totalFrames: 1 } : {});
      setShowEndConfirm(false);
      fetchSession();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isFrameMode ? 'complete frame' : 'end session'}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddSession() {
    if (!canPerformActions) return;
    if (!session?.session?.groupId) return;
    setActionLoading(true);
    try {
      const currentSession = session.session;
      const res = await api.post(`/sessions/group/${currentSession.groupId}/add-session`, {
        pricingMethod: currentSession.pricingMethod,
        hourlyRate: currentSession.hourlyRate,
        frameRate: currentSession.frameRate,
        perMinuteRate: currentSession.perMinuteRate,
      });
      // Navigate to the new session
      navigate(`/sessions/${res.data.data.session._id}`);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to add ${unitLabelLower}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleFinishGroup() {
    if (!canPerformActions) return;
    if (!session?.session?.groupId) return;
    setActionLoading(true);
    try {
      await api.post(`/sessions/group/${session.session.groupId}/finish`);
      setShowFinishGroupConfirm(false);
      fetchSession();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to finish ${unitLabelLower}s`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckout() {
    if (!canPerformActions) return;
    if (!session?.session?.groupId) return;
    setActionLoading(true);
    try {
      const payload = {
        paymentMethod,
        discount: groupDiscount ? Number(groupDiscount) : 0,
        discountReason: groupDiscountReason,
      };
      if (groupAmountPaid && Number(groupAmountPaid) > 0) {
        payload.amountPaid = Number(groupAmountPaid);
      }
      await api.post(`/sessions/group/${session.session.groupId}/checkout`, payload);
      setShowCheckoutModal(false);
      setGroupAmountPaid('');
      setGroupDiscount('');
      setGroupDiscountReason('');
      fetchSession();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to checkout');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} strokeWidth={1.5} className="animate-spin text-on-surface-variant" />
        </div>
      </AppLayout>
    );
  }

  if (!session?.session) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <TimerOff size={32} strokeWidth={1.5} className="text-on-surface-variant mb-4" />
          <p className="font-body text-body text-on-surface-variant">Session not found</p>
          <button onClick={() => navigate('/sessions')} className="mt-4 text-primary font-item-title hover:underline">
            Back to Sessions
          </button>
        </div>
      </AppLayout>
    );
  }

  const s = session.session;
  const isActive = s.status === 'active';
  const isPaused = s.status === 'paused';
  const isLive = isActive || isPaused;
  const customer = s.customer || {};
  const table = s.table || {};
  const groupId = s.groupId;
  const isFrameMode = s.pricingMethod === 'frame';
  const isPerMinuteMode = s.pricingMethod === 'per_minute';
  const unitLabel = isFrameMode ? 'Frame' : 'Session';
  const unitLabelLower = isFrameMode ? 'frame' : 'session';
  const unitLabelPlural = isFrameMode ? 'Frames' : 'Sessions';

  // Table-visit level state
  const completedSessions = groupData?.sessions?.filter((gs) => gs.status === 'completed') || [];
  const hasActiveSession = groupData?.hasActiveSession ?? isLive;
  const allCompleted = groupData?.allCompleted ?? (s.status === 'completed' && completedSessions.length > 0);
  const isGroupCheckedOut = groupData?.sessions?.every((gs) => gs.paymentStatus === 'paid' || gs.paymentStatus === 'partial') ?? false;
  // Table is still occupied = visit not finished yet (user can still add sessions)
  const isGroupActive = groupData?.table?.status === 'occupied' || (!groupData && groupId && !isGroupCheckedOut);

  // Calculate totals for the visit
  const groupTotals = groupData?.totals
    ? {
        ...groupData.totals,
        totalPaid: groupData.sessions?.reduce((sum, gs) => sum + (gs.amountPaid || 0), 0) || 0,
      }
    : {
        totalTableCharges: isLive ? (session.runningCharges || 0) : s.tableCharges,
        totalCafeCharges: s.cafeCharges || 0,
        totalDiscount: s.discount || 0,
        totalAmount: isLive ? (session.runningCharges || 0) + (s.cafeCharges || 0) : s.finalAmount,
        totalPaid: s.amountPaid || 0,
      };

  // Calculate total time across all sessions in the visit
  const allGroupSessions = groupData?.sessions || [];
  const totalGroupTime = allGroupSessions.reduce((sum, gs) => {
    if (gs.status === 'completed') return sum + (gs.totalPlayingTime || 0);
    if (gs.status === 'active' || gs.status === 'paused') {
      const start = new Date(gs.startTime).getTime();
      const pausedDuration = gs.totalPausedDuration || 0;
      const now = Date.now();
      let effective;
      if (gs.status === 'paused' && gs.pausedAt) {
        effective = new Date(gs.pausedAt).getTime() - start - pausedDuration;
      } else {
        effective = now - start - pausedDuration;
      }
      return sum + Math.max(0, effective);
    }
    return sum;
  }, 0);

  // View-only mode: completed session with no visit actions available
  const isViewOnly = s.status === 'completed' && (isGroupCheckedOut || !groupId);

  return (
    <AppLayout>
      {showEndConfirm && canPerformActions && (
        <ConfirmModal
          title={isFrameMode ? 'Complete Frame' : 'End Session'}
          description={
            isFrameMode
              ? 'Complete this frame? The table will remain occupied for additional frames.'
              : 'End this session? The table will remain occupied for additional sessions.'
          }
          confirmLabel={isFrameMode ? 'Complete' : 'Stop'}
          confirmTone="danger"
          icon={isFrameMode ? CheckCheck : Square}
          loading={actionLoading}
          onClose={() => setShowEndConfirm(false)}
          onConfirm={handleEndSession}
        />
      )}

      {showFinishGroupConfirm && canPerformActions && (
        <ConfirmModal
          title={`Finish ${unitLabelPlural}`}
          description={`Finish all ${unitLabelPlural.toLowerCase()}? The table will be freed and checkout will be available.`}
          confirmLabel="Finish"
          confirmTone="primary"
          icon={CheckCircle2}
          loading={actionLoading}
          onClose={() => setShowFinishGroupConfirm(false)}
          onConfirm={handleFinishGroup}
        />
      )}

      {/* Back button */}
      <button
        onClick={() => navigate('/sessions')}
        className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-4 font-item-title text-item-title"
      >
        <ChevronLeft size={20} strokeWidth={1.8} />
        Back to Sessions
      </button>

      {/* Live indicator bar */}
      {isLive && (
        <div className="bg-good-tint text-good px-4 py-2 rounded-full flex items-center gap-2 w-fit mb-6">
          <span className="w-2 h-2 rounded-full bg-live-indicator animate-pulse" />
          <span className="font-caption font-bold tracking-wider uppercase">
            {isFrameMode ? 'Live Frame' : 'Live Session'}: Table {String(table.tableNumber || '').padStart(2, '0')}
          </span>
        </div>
      )}

      {s.status === 'completed' && !isGroupCheckedOut && (
        <div className="bg-warn-tint text-warn px-4 py-2 rounded-full flex items-center gap-2 w-fit mb-6">
          <Hourglass size={18} strokeWidth={1.8} />
          <span className="font-caption font-bold tracking-wider uppercase">Awaiting Checkout</span>
        </div>
      )}

      {isGroupCheckedOut && (
        <div className="bg-good-tint text-good px-4 py-2 rounded-full flex items-center gap-2 w-fit mb-6">
          <CheckCircle2 size={18} strokeWidth={1.8} />
          <span className="font-caption font-bold tracking-wider uppercase">Paid & Completed</span>
        </div>
      )}

      {error && (
        <div className="p-3 mb-4 bg-status-alert-tint text-status-alert rounded-xl font-caption text-caption">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column — Timer & Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* Timer Card */}
          <div className="bg-surface rounded-xl p-5 md:p-6 border border-outline-variant/10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="font-caption text-on-surface-variant uppercase font-bold tracking-widest mb-1">
                  {isLive ? (isFrameMode ? 'Frame Timer' : 'Active Timer') : 'Total Duration'}
                </h2>
                <p className="font-title text-title text-on-surface">
                  {s.status === 'completed'
                    ? (isFrameMode ? 'Total Frame Time' : 'Total Playing Time')
                    : groupId
                    ? `#${completedSessions.length + 1} ${unitLabel}`
                    : `${unitLabel} Details`}
                </p>
              </div>
              {isLive && !isViewOnly && canPerformActions && (
                <div className="flex gap-2">
                  {!isFrameMode && isActive && (
                    <button
                      onClick={handlePause}
                      disabled={actionLoading}
                      className="p-3 bg-paper rounded-full hover:bg-surface-variant transition-all flex items-center justify-center shadow-sm border border-outline-variant/10"
                      title="Pause"
                    >
                      <Pause size={24} strokeWidth={1.8} className="text-warn" />
                    </button>
                  )}
                  {!isFrameMode && isPaused && (
                    <button
                      onClick={handleResume}
                      disabled={actionLoading}
                      className="p-3 bg-paper rounded-full hover:bg-surface-variant transition-all flex items-center justify-center shadow-sm border border-outline-variant/10"
                      title="Resume"
                    >
                      <Play size={24} strokeWidth={1.8} className="text-good" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowCafeModal(true)}
                    className="p-3 bg-paper rounded-full hover:bg-surface-variant transition-all flex items-center justify-center shadow-sm border border-outline-variant/10"
                    title="Add Cafe Items"
                  >
                    <Coffee size={24} strokeWidth={1.8} className="text-primary" />
                  </button>
                  <button
                    onClick={() => setShowEndConfirm(true)}
                    disabled={actionLoading}
                    className="p-3 bg-status-alert-tint rounded-full hover:bg-status-alert/20 transition-all flex items-center justify-center shadow-sm border border-outline-variant/10"
                    title={isFrameMode ? 'Complete Frame' : 'End Session'}
                  >
                    {isFrameMode
                      ? <CheckCheck size={24} strokeWidth={1.8} className="text-status-alert" />
                      : <Square size={24} strokeWidth={1.8} className="text-status-alert" />
                    }
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center justify-center py-8 md:py-12 bg-paper rounded-lg border border-outline-variant/5">
              {isLive ? (
                <ActiveTimer session={s} />
              ) : (
                <CompletedTimer session={s} totalGroupTime={totalGroupTime} unitLabel={unitLabel} />
              )}

              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mt-6">
                <div className="text-center">
                  <p className="font-caption text-caption text-on-surface-variant">Start Time</p>
                  <p className="font-item-title text-item-title">{formatTime(s.startTime)}</p>
                </div>
                {s.endTime && (
                  <>
                    <div className="h-8 w-px bg-outline-variant/30 hidden sm:block" />
                    <div className="text-center">
                      <p className="font-caption text-caption text-on-surface-variant">End Time</p>
                      <p className="font-item-title text-item-title">{formatTime(s.endTime)}</p>
                    </div>
                  </>
                )}
                <div className="h-8 w-px bg-outline-variant/30 hidden sm:block" />
                <div className="text-center">
                  <p className="font-caption text-caption text-on-surface-variant">Rate</p>
                  <p className="font-item-title text-item-title">{rateDisplay(s)}</p>
                </div>
                <div className="h-8 w-px bg-outline-variant/30 hidden sm:block" />
                <div className="text-center">
                  <p className="font-caption text-caption text-on-surface-variant">Table</p>
                  <p className="font-item-title text-item-title">T-{String(table.tableNumber || '').padStart(2, '0')}</p>
                </div>
              </div>
            </div>

            {/* + Add New Session button below timer */}
            {groupId && isGroupActive && !isGroupCheckedOut && !isViewOnly && canPerformActions && (
              <button
                onClick={handleAddSession}
                disabled={actionLoading || isLive}
                className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-item-title text-item-title disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <PlusCircle size={20} strokeWidth={1.8} />
                {isFrameMode ? 'Add New Frame' : 'Add New Session'}
              </button>
            )}
          </div>

          {/* Previous Sessions in Visit */}
          {completedSessions.length > 0 && (
            <PreviousSessionsList sessions={completedSessions} unitLabel={unitLabel} />
          )}

          {/* Customer & Pricing Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Details */}
            <div className="bg-paper rounded-xl p-5 border border-outline-variant/20 shadow-sm">
              <h3 className="font-caption text-on-surface-variant uppercase font-bold tracking-widest mb-4">Customer Details</h3>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center">
                  <User size={28} strokeWidth={1.5} className="text-on-surface-variant" />
                </div>
                <div>
                  <p className="font-title text-[18px] text-on-surface">{customer.name || 'Guest'}</p>
                  {customer.phone && (
                    <p className="font-caption text-caption text-on-surface-variant">{customer.phone}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full font-caption text-[11px] font-bold uppercase ${
                  s.pricingMethod === 'hourly' ? 'bg-data-tint text-data' : s.pricingMethod === 'per_minute' ? 'bg-primary-tint text-primary' : s.pricingMethod === 'frame' ? 'bg-warn-tint text-warn' : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {pricingLabel(s.pricingMethod)}
                </span>
                {isPaused && (
                  <span className="px-3 py-1 rounded-full bg-warn-tint text-warn font-caption text-[11px] font-bold uppercase">
                    Paused
                  </span>
                )}
              </div>
            </div>

            {/* Session Pricing */}
            <div className="bg-paper rounded-xl p-5 border border-outline-variant/20 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-caption text-on-surface-variant uppercase font-bold tracking-widest mb-2">
                  {isFrameMode ? 'Frame Pricing' : 'Session Pricing'}
                </h3>
                <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
                    <span className="font-body text-body text-on-surface-variant">Method</span>
                    <span className="font-item-title text-item-title">{pricingLabel(s.pricingMethod)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
                    <span className="font-body text-body text-on-surface-variant">Rate</span>
                    <span className="font-item-title text-item-title">{rateDisplay(s)}</span>
                  </div>
                {s.notes && (
                  <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
                    <span className="font-body text-body text-on-surface-variant">Notes</span>
                    <span className="font-caption text-caption text-on-surface-variant text-right max-w-[200px] truncate">{s.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cafe Items */}
          {s.cafeItems && s.cafeItems.length > 0 && (
            <div className="bg-surface rounded-xl p-5 border border-outline-variant/10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-caption text-on-surface-variant uppercase font-bold tracking-widest">Cafe Items</h3>
              </div>
              <div className="space-y-3">
                {s.cafeItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-paper rounded-lg border border-outline-variant/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-surface-container rounded-md flex items-center justify-center">
                        <Coffee size={20} strokeWidth={1.8} className="text-on-surface-variant" />
                      </div>
                      <div>
                        <p className="font-item-title text-item-title">{item.name || 'Item'}</p>
                        <p className="font-caption text-caption text-on-surface-variant">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-item-title text-item-title">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column — Billing Summary */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-primary text-on-primary rounded-xl p-5">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Receipt size={120} strokeWidth={1.5} />
            </div>
            <h3 className="font-caption opacity-60 uppercase font-bold tracking-widest mb-6">
              {groupId && completedSessions.length > 0 ? `Group Bill Summary` : `Current Bill Summary`}
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center">
                <span className="opacity-70">Status</span>
                <span className="font-title text-[20px] capitalize">
                  {s.status === 'completed' ? 'Completed' : s.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-70">Type</span>
                <span className="font-title text-[20px]">{pricingLabel(s.pricingMethod)}</span>
              </div>
              {/* Session breakdown */}
              {groupId && completedSessions.length > 0 && (
                <div className="space-y-2 pb-4 border-b border-on-primary/10">
                  {completedSessions.map((cs, i) => (
                    <div key={cs._id} className="flex justify-between items-center">
                      <span className="opacity-70 text-sm">{unitLabel} {i + 1} ({formatDuration(cs.totalPlayingTime)})</span>
                      <span className="font-item-title">{formatCurrency(cs.tableCharges || 0)}</span>
                    </div>
                  ))}
                  {isLive && (
                    <div className="flex justify-between items-center">
                      <span className="opacity-70 text-sm">Current {unitLabel} (running)</span>
                      <span className="font-item-title">{formatCurrency(session.runningCharges || 0)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Total Time across all sessions */}
              {(allGroupSessions.length > 1 || (groupId && completedSessions.length > 0)) && (
                <div className="flex justify-between items-center pb-4 border-b border-on-primary/10">
                  <span className="opacity-70">Total Time (All {unitLabelPlural})</span>
                  <span className="font-title text-[20px]">{formatDuration(totalGroupTime)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="opacity-70">Table Charges</span>
                <span className="font-title text-[20px]">{formatCurrency(groupTotals.totalTableCharges)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-70">Cafe Charges</span>
                <span className="font-title text-[20px]">{formatCurrency(groupTotals.totalCafeCharges)}</span>
              </div>
              {groupTotals.totalDiscount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="opacity-70">Discount</span>
                  <span className="font-title text-[20px]">-{formatCurrency(groupTotals.totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-4 mt-4 border-t border-on-primary/10">
                <span className="font-bold">Total Payable</span>
                <span className="text-[32px] font-bold tracking-tight">
                  {formatCurrency(groupTotals.totalAmount)}
                </span>
              </div>
              {isGroupCheckedOut && (
                <div className="space-y-2 pt-2 border-t border-on-primary/10 mt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="opacity-70">Amount Paid</span>
                    <span className="font-item-title">{formatCurrency(groupTotals.totalPaid || 0)}</span>
                  </div>
                  {groupTotals.totalAmount - (groupTotals.totalPaid || 0) > 0 && (
                    <div className="flex justify-between items-center text-sm text-amber-200">
                      <span className="opacity-70 font-semibold">Leftover Dues (Udhar)</span>
                      <span className="font-bold">{formatCurrency(groupTotals.totalAmount - (groupTotals.totalPaid || 0))}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons for active group */}
            {isLive && !isGroupCheckedOut && !isViewOnly && canPerformActions && (
              <div className="mt-8 space-y-3">
                <button
                  onClick={() => setShowEndConfirm(true)}
                  disabled={actionLoading}
                  className="w-full bg-paper text-primary font-bold py-3.5 rounded-full flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isFrameMode
                    ? <CheckCheck size={20} strokeWidth={1.8} />
                    : <Square size={20} strokeWidth={1.8} />
                  }
                  {isFrameMode ? 'Complete Frame' : 'End Session'}
                </button>
                {!hasActiveSession && groupId && (
                  <button
                    onClick={() => setShowFinishGroupConfirm(true)}
                    disabled={actionLoading}
                    className="w-full bg-paper text-primary font-bold py-3.5 rounded-full flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <CheckCheck size={20} strokeWidth={1.8} />
                    Finish All {unitLabelPlural}
                  </button>
                )}
              </div>
            )}

            {/* Checkout button when all sessions are completed */}
            {allCompleted && !isGroupCheckedOut && groupId && !isViewOnly && canPerformActions && (
              <div className="mt-8 space-y-3">
                <button
                  onClick={() => setShowCheckoutModal(true)}
                  disabled={actionLoading}
                  className="w-full bg-paper text-primary font-bold py-3.5 rounded-full flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <CreditCard size={20} strokeWidth={1.8} />
                  Checkout
                </button>
              </div>
            )}

            {/* Completed / paid status */}
            {isGroupCheckedOut && (
              <div className="mt-6">
                <span className="px-4 py-2 rounded-full font-item-title text-item-title inline-flex items-center gap-2 bg-good-tint text-good">
                  <CheckCircle2 size={18} strokeWidth={1.8} />
                  Payment Completed
                </span>
              </div>
            )}

            {/* Single completed session (no group) */}
            {s.status === 'completed' && !groupId && (
              <div className="mt-6">
                <span className={`px-4 py-2 rounded-full font-item-title text-item-title inline-flex items-center gap-2 ${
                  s.paymentStatus === 'paid' ? 'bg-good-tint text-good' : 'bg-warn-tint text-warn'
                }`}>
                  {s.paymentStatus === 'paid'
                    ? <CheckCircle2 size={18} strokeWidth={1.8} />
                    : <Hourglass size={18} strokeWidth={1.8} />
                  }
                  Payment: {s.paymentStatus || 'pending'}
                </span>
              </div>
            )}
          </div>

          {/* Created by info */}
          <div className="bg-surface rounded-xl p-5 border border-outline-variant/10">
            <h3 className="font-caption text-on-surface-variant uppercase font-bold tracking-widest mb-3">Visit Info</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-body text-body text-on-surface-variant">Created By</span>
                <span className="font-item-title text-item-title">{s.createdBy?.name || '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body text-body text-on-surface-variant">Started</span>
                <span className="font-item-title text-item-title">{formatDateTime(s.startTime)}</span>
              </div>
              {s.endTime && (
                <div className="flex justify-between items-center">
                  <span className="font-body text-body text-on-surface-variant">Ended</span>
                  <span className="font-item-title text-item-title">{formatDateTime(s.endTime)}</span>
                </div>
              )}
              {s.endedBy && (
                <div className="flex justify-between items-center">
                  <span className="font-body text-body text-on-surface-variant">Ended By</span>
                  <span className="font-item-title text-item-title">{s.endedBy.name || '—'}</span>
                </div>
              )}
              {groupId && (
                <div className="flex justify-between items-center">
                  <span className="font-body text-body text-on-surface-variant">Visit ID</span>
                  <span className="font-caption text-caption text-on-surface-variant truncate max-w-[150px]">{groupId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
          {showCheckoutModal && canPerformActions && (
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-on-background/50 backdrop-blur-sm" onClick={() => setShowCheckoutModal(false)} />
          <div className="relative bg-paper rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl border border-outline-variant/20 max-h-[90vh] flex flex-col">
            {/* Sticky header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-outline-variant/20 shrink-0">
              <h2 className="font-item-title text-item-title text-on-surface text-lg">Checkout</h2>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <X size={20} strokeWidth={1.8} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto p-4 sm:p-6 flex-1 overscroll-contain">
              {/* Session Breakdown */}
              <div className="bg-surface rounded-xl p-3 sm:p-4 mb-4 space-y-3">
                <h3 className="font-caption text-on-surface-variant uppercase font-bold tracking-widest text-xs">
                  {isFrameMode ? 'Frame Breakdown' : 'Session Breakdown'}
                </h3>
                {completedSessions.map((cs, i) => (
                  <div key={cs._id} className="flex justify-between items-center py-2 border-b border-outline-variant/10 last:border-0">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-item-title text-item-title text-on-surface">{unitLabel} {i + 1}</p>
                      <p className="font-caption text-caption text-on-surface-variant">{formatDuration(cs.totalPlayingTime)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-item-title text-item-title text-on-surface">{formatCurrency(cs.tableCharges || 0)}</p>
                      {cs.cafeCharges > 0 && (
                        <p className="font-caption text-caption text-on-surface-variant">+{formatCurrency(cs.cafeCharges)} cafe</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="bg-primary/5 rounded-xl p-3 sm:p-4 mb-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-body text-body text-on-surface-variant">Table Charges</span>
                  <span className="font-item-title text-item-title">{formatCurrency(groupTotals.totalTableCharges)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-body text-body text-on-surface-variant">Cafe Charges</span>
                  <span className="font-item-title text-item-title">{formatCurrency(groupTotals.totalCafeCharges)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-outline-variant/20">
                  <span className="font-bold text-on-surface">Total</span>
                  <span className="font-title text-title text-on-surface font-bold">{formatCurrency(groupTotals.totalAmount)}</span>
                </div>
              </div>

              {/* Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-caption text-caption font-semibold ml-1 text-on-surface">Discount ({currencyCode})</label>
                  <input
                    type="number"
                    value={groupDiscount}
                    onChange={(e) => setGroupDiscount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container-lowest border border-surface-variant rounded-lg focus:ring-2 focus:ring-primary text-body font-body"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-caption text-caption font-semibold ml-1 text-on-surface">Reason</label>
                  <input
                    type="text"
                    value={groupDiscountReason}
                    onChange={(e) => setGroupDiscountReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container-lowest border border-surface-variant rounded-lg focus:ring-2 focus:ring-primary text-body font-body"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Amount Paid (Udhaar / Partial Payment) */}
              <div className="mb-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-caption text-caption font-semibold ml-1 text-on-surface">Amount Paid ({currencyCode})</label>
                  <input
                    type="number"
                    value={groupAmountPaid}
                    onChange={(e) => setGroupAmountPaid(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container-lowest border border-surface-variant rounded-lg focus:ring-2 focus:ring-primary text-body font-body"
                    placeholder={`Full amount: ${formatCurrency(groupTotals.totalAmount)}`}
                    min="0"
                  />
                  {groupAmountPaid && Number(groupAmountPaid) < groupTotals.totalAmount && (
                    <div className="flex items-center gap-2 mt-1 ml-1">
                      <span className="font-caption text-caption text-warn">
                        Remaining {formatCurrency(groupTotals.totalAmount - Number(groupAmountPaid))} will be added to udhaar
                      </span>
                    </div>
                  )}
                  {!groupAmountPaid && (
                    <button
                      type="button"
                      onClick={() => setGroupAmountPaid(String(groupTotals.totalAmount))}
                      className="self-end font-caption text-primary hover:underline mt-1"
                    >
                      Pay full amount
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-4">
                <label className="font-caption text-caption font-semibold ml-1 text-on-surface block mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'cash', label: 'Cash', Icon: CreditCard },
                    { value: 'card', label: 'Card', Icon: CreditCard },
                    { value: 'bank_transfer', label: 'Transfer', Icon: Landmark },
                    { value: 'mobile_wallet', label: 'Wallet', Icon: Smartphone },
                  ].map((pm) => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => setPaymentMethod(pm.value)}
                      className={`px-3 py-2.5 rounded-full font-item-title text-item-title transition-all flex items-center justify-center gap-2 ${
                        paymentMethod === pm.value
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      <pm.Icon size={18} strokeWidth={1.8} />
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky footer */}
            <div className="p-4 sm:p-6 border-t border-outline-variant/20 shrink-0">
              <button
                onClick={handleCheckout}
                disabled={actionLoading}
                className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-item-title text-[15px] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 size={20} strokeWidth={1.8} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={20} strokeWidth={1.8} />
                )}
                {actionLoading ? 'Processing...' : `Confirm Payment — ${formatCurrency(groupAmountPaid && Number(groupAmountPaid) > 0 ? Number(groupAmountPaid) : groupTotals.totalAmount)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cafe Session Modal */}
      {showCafeModal && isLive && (
        <SessionCafeModal
          sessionId={s._id}
          onClose={() => setShowCafeModal(false)}
          onItemsAdded={fetchSession}
        />
      )}
    </AppLayout>
  );
}

function PreviousSessionsList({ sessions, unitLabel = 'Session' }) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="bg-surface rounded-xl p-5 border border-outline-variant/10">
      <h3 className="font-caption text-on-surface-variant uppercase font-bold tracking-widest mb-4">
        Previous {unitLabel}s ({sessions.length})
      </h3>
      <div className="space-y-3">
        {sessions.map((cs, i) => {
          const isExpanded = expandedId === cs._id;
          return (
            <div key={cs._id} className="bg-paper rounded-lg border border-outline-variant/5 overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : cs._id)}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-container/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                    <span className="font-item-title text-on-surface-variant">#{i + 1}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-item-title text-item-title text-on-surface">
                      {unitLabel} {i + 1}
                    </p>
                    <p className="font-caption text-caption text-on-surface-variant">
                      {formatDuration(cs.totalPlayingTime)} • {pricingLabel(cs.pricingMethod)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-item-title text-item-title text-on-surface">{formatCurrency(cs.tableCharges || 0)}</p>
                    {cs.cafeCharges > 0 && (
                      <p className="font-caption text-caption text-on-surface-variant">+{formatCurrency(cs.cafeCharges)} cafe</p>
                    )}
                  </div>
                  <ChevronDown
                    size={20}
                    strokeWidth={1.8}
                    className={`text-on-surface-variant transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-outline-variant/10">
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <div>
                      <p className="font-caption text-caption text-on-surface-variant">Started</p>
                      <p className="font-item-title text-item-title text-on-surface">{formatDateTime(cs.startTime)}</p>
                    </div>
                    <div>
                      <p className="font-caption text-caption text-on-surface-variant">Ended</p>
                      <p className="font-item-title text-item-title text-on-surface">{cs.endTime ? formatDateTime(cs.endTime) : '—'}</p>
                    </div>
                    <div>
                      <p className="font-caption text-caption text-on-surface-variant">Total Time</p>
                      <p className="font-item-title text-item-title text-on-surface">{formatDuration(cs.totalPlayingTime)}</p>
                    </div>
                    <div>
                      <p className="font-caption text-caption text-on-surface-variant">Pricing</p>
                      <p className="font-item-title text-item-title text-on-surface">{pricingLabel(cs.pricingMethod)}</p>
                    </div>
                    <div>
                      <p className="font-caption text-caption text-on-surface-variant">Rate</p>
                      <p className="font-item-title text-item-title text-on-surface">{rateDisplay(cs)}</p>
                    </div>
                    <div>
                      <p className="font-caption text-caption text-on-surface-variant">Table Charges</p>
                      <p className="font-item-title text-item-title text-on-surface">{formatCurrency(cs.tableCharges || 0)}</p>
                    </div>
                    {cs.cafeCharges > 0 && (
                      <div>
                        <p className="font-caption text-caption text-on-surface-variant">Cafe Charges</p>
                        <p className="font-item-title text-item-title text-on-surface">{formatCurrency(cs.cafeCharges)}</p>
                      </div>
                    )}
                    {cs.discount > 0 && (
                      <div>
                        <p className="font-caption text-caption text-on-surface-variant">Discount</p>
                        <p className="font-item-title text-item-title text-on-surface">-{formatCurrency(cs.discount)}</p>
                      </div>
                    )}
                    <div>
                      <p className="font-caption text-caption text-on-surface-variant">Total</p>
                      <p className="font-item-title text-item-title text-on-surface font-bold">{formatCurrency(cs.finalAmount || 0)}</p>
                    </div>
                  </div>

                  {/* Cafe items in this session */}
                  {cs.cafeItems && cs.cafeItems.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-outline-variant/10">
                      <p className="font-caption text-on-surface-variant uppercase font-bold tracking-widest text-xs mb-2">Cafe Items</p>
                      <div className="space-y-2">
                        {cs.cafeItems.map((item, j) => (
                          <div key={j} className="flex items-center justify-between p-2 bg-surface rounded-lg">
                            <div className="flex items-center gap-2">
                              <Coffee size={16} strokeWidth={1.8} className="text-on-surface-variant" />
                              <span className="font-caption text-caption text-on-surface">{item.name || 'Item'} × {item.quantity}</span>
                            </div>
                            <span className="font-caption text-caption text-on-surface">{formatCurrency(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActiveTimer({ session }) {
  const { formatted } = useSessionTimer(session);
  return (
    <span className="font-numeral-hero text-numeral-hero text-primary tracking-tighter">
      {formatted}
    </span>
  );
}

function CompletedTimer({ session, totalGroupTime, unitLabel = 'Session' }) {
  const start = session.startTime ? new Date(session.startTime).getTime() : 0;
  const end = session.endTime ? new Date(session.endTime).getTime() : 0;
  const pausedDuration = session.totalPausedDuration || 0;
  const calculatedMs = start && end ? Math.max(0, end - start - pausedDuration) : 0;
  const sessionMs = session.totalPlayingTime ?? calculatedMs;

  const ms = totalGroupTime && totalGroupTime > 0 ? totalGroupTime : sessionMs;
  const formatted = formatDuration(ms);

  return (
    <div className="text-center">
      <span className="font-numeral-hero text-numeral-hero text-on-surface-variant tracking-tighter">{formatted}</span>
      <p className="font-caption text-caption text-good font-semibold mt-2 flex items-center justify-center gap-1.5">
        <CheckCircle2 size={18} strokeWidth={1.8} />
        {unitLabel} Completed • Total Time
      </p>
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
