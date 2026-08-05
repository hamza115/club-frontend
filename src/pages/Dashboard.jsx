import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, CircleDot } from 'lucide-react';
import api from '../lib/api';
import AppLayout from '../components/AppLayout';
import { useSocket } from '../context/SocketContext';
import { formatCurrency } from '../lib/currency';

function StatCard({ label, value, tint }) {
  return (
    <div className="bg-paper rounded-xl p-card-padding-sm flex flex-col justify-between h-24 md:h-32 relative overflow-hidden">
      {tint && <div className={`absolute inset-0 ${tint} -z-10`} />}
      <span className="font-caption text-caption text-secondary">{label}</span>
      <span className="font-title text-title text-primary">{value}</span>
    </div>
  );
}

const TABLE_STATUS_STYLES = {
  occupied: { border: 'border-good-tint', badge: 'bg-good-tint text-good', label: 'Active' },
  available: { border: 'border-outline-variant/30', badge: 'bg-surface-container text-on-surface-variant', label: 'Available' },
  reserved: { border: 'border-warn-tint', badge: 'bg-warn-tint text-warn', label: 'Reserved' },
  maintenance: { border: 'border-alert-tint', badge: 'bg-alert-tint text-alert', label: 'Maint' },
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { on, off } = useSocket();

  useEffect(() => {
    let cancelled = false;
    api.get('/reports/dashboard')
      .then((res) => {
        if (!cancelled) setStats(res.data.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setStats({
            todayRevenue: 0,
            todayTableRevenue: 0,
            todayTotalCafeRevenue: 0,
            todaySessions: 0,
            activeSessions: 0,
            totalCustomers: 0,
            lowStockProducts: 0,
            pendingPayments: { total: 0, count: 0 },
            recentSessions: [],
            weeklyRevenueTrend: [],
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  function fetchTables() {
    api.get('/tables')
      .then((res) => setTables(res.data.data.tables || []))
      .catch(() => setTables([]));
  }

  useEffect(() => { fetchTables(); }, []);

  const handleSessionStarted = useCallback(() => fetchTables(), []);
  const handleSessionEnded = useCallback(() => fetchTables(), []);
  const handleTableUpdated = useCallback(() => fetchTables(), []);

  useEffect(() => {
    on('session:started', handleSessionStarted);
    on('session:ended', handleSessionEnded);
    on('table:updated', handleTableUpdated);
    return () => {
      off('session:started', handleSessionStarted);
      off('session:ended', handleSessionEnded);
      off('table:updated', handleTableUpdated);
    };
  }, [on, off, handleSessionStarted, handleSessionEnded, handleTableUpdated]);

  if (error) {
    console.log('Dashboard error:', error);
  }

  const trend = stats?.weeklyRevenueTrend || [];
  const maxRevenue = Math.max(...trend.map((d) => d.revenue), 1);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function formatDayLabel(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((today - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return dayLabels[d.getDay()];
  }

  return (
    <AppLayout>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-8">
        <StatCard label="Today's Revenue" value={loading ? '...' : formatCurrency(stats?.todayRevenue ?? 0)} tint="bg-surface-variant/20" />
        <StatCard label="Active Sessions" value={loading ? '...' : stats?.activeSessions ?? 0} tint="bg-data-tint/30" />
        <StatCard label="Total Customers" value={loading ? '...' : stats?.totalCustomers ?? 0} tint="bg-good-tint/30" />
        <StatCard label="Pending Payments" value={loading ? '...' : stats?.pendingPayments?.count ?? 0} tint="bg-warn-tint/30" />
        <StatCard label="Pending Amount" value={loading ? '...' : formatCurrency(stats?.pendingPayments?.total ?? 0)} />
        <StatCard label="Low Stock Items" value={loading ? '...' : stats?.lowStockProducts ?? 0} />
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mb-8">
        {/* Performance Trends Chart */}
        <div className="lg:col-span-2 bg-surface rounded-[18px] md:rounded-[24px] p-4 md:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-item-title text-item-title text-on-surface">Revenue — Last 7 Days</h2>
            {trend.length > 0 && (
              <span className="font-caption text-caption text-on-surface-variant">
                Total: {formatCurrency(trend.reduce((s, d) => s + d.revenue, 0))}
              </span>
            )}
          </div>
          <div className="bg-paper rounded-[18px] p-4 flex-1 min-h-[300px] flex flex-col">
            {loading ? (
              <div className="w-full flex items-center justify-center flex-1">
                <Loader2 size={20} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
              </div>
            ) : trend.length === 0 ? (
              <div className="w-full flex items-center justify-center flex-1">
                <p className="font-body text-body text-on-surface-variant">No revenue data yet</p>
              </div>
            ) : (
              <div className="w-full flex items-end justify-between gap-2 flex-1 pt-8">
                {trend.map((day, i) => {
                  const barMaxPx = 220;
                  const barPx = maxRevenue > 0 ? Math.max((day.revenue / maxRevenue) * barMaxPx, 4) : 4;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                      <span className="font-caption text-[10px] text-on-surface-variant whitespace-nowrap">
                        {formatCurrency(day.revenue)}
                      </span>
                      <div
                        className="w-full rounded-t-md bg-primary hover:brightness-110 transition-all"
                        style={{ height: `${barPx}px`, minHeight: '4px' }}
                      />
                      <span className="font-caption text-[10px] text-on-surface-variant">{formatDayLabel(day.date)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4 md:gap-8">
          {/* Alerts */}
          <div className={`rounded-[18px] md:rounded-[24px] p-4 md:p-6 flex flex-col gap-4 border ${
            stats?.lowStockProducts > 0
              ? 'bg-alert-tint border-status-alert/20'
              : 'bg-surface border-outline-variant/20'
          }`}>
            <div className={`flex items-center gap-2 ${stats?.lowStockProducts > 0 ? 'text-alert' : 'text-on-surface-variant'}`}>
              <AlertTriangle size={20} strokeWidth={1.8} />
              <h2 className="font-item-title text-item-title">Alerts</h2>
            </div>
            {stats?.lowStockProducts > 0 ? (
              <p className={`font-body text-body ${stats?.lowStockProducts > 0 ? 'text-alert' : 'text-on-surface-variant'}`}>
                {stats.lowStockProducts} product{stats.lowStockProducts !== 1 ? 's' : ''} below minimum stock
              </p>
            ) : (
              <p className="font-body text-body text-on-surface-variant">No alerts</p>
            )}
          </div>

          {/* Recent Sessions */}
          <div className="bg-surface rounded-[18px] md:rounded-[24px] p-4 md:p-6 flex flex-col gap-4 flex-1">
            <h2 className="font-item-title text-item-title text-on-surface">Recent Sessions</h2>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={20} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
              </div>
            ) : stats?.recentSessions?.length ? (
              stats.recentSessions.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-outline-variant/20 last:border-0">
                  <span className="font-body text-body text-on-surface">Table {s.table?.tableNumber ?? '—'}</span>
                  <span className="font-caption text-caption text-on-surface-variant capitalize">{s.status}</span>
                  <span className="font-caption text-caption text-primary">{formatCurrency(s.finalAmount ?? 0)}</span>
                </div>
              ))
            ) : (
              <p className="font-body text-body text-on-surface-variant">No recent sessions</p>
            )}
          </div>
        </div>
      </div>

      {/* Table Status */}
      <div className="bg-surface rounded-[18px] md:rounded-[24px] p-4 md:p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="font-item-title text-item-title text-on-surface">Table Status</h2>
          <button onClick={() => navigate('/tables')} className="text-primary font-item-title text-item-title hover:underline">View All</button>
        </div>
        {tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CircleDot size={32} strokeWidth={1.5} className="text-on-surface-variant mb-2" />
            <p className="font-body text-body text-on-surface-variant">No tables found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
            {tables.map((t) => {
              const style = TABLE_STATUS_STYLES[t.status] || TABLE_STATUS_STYLES.available;
              const isOccupied = t.status === 'occupied';
              const session = t.currentSession || {};
              const customer = session.customer || {};
              const isPaused = session.status === 'paused';
              return (
                <button
                  key={t._id}
                  onClick={() => navigate('/tables')}
                  className={`bg-paper rounded-xl p-3 md:p-4 flex flex-col items-center justify-center gap-2 border-2 ${style.border} shadow-sm hover:shadow-md transition-shadow ${t.status === 'maintenance' ? 'opacity-60' : ''}`}
                >
                  <span className="font-item-title text-item-title text-on-surface">T{String(t.tableNumber).padStart(2, '0')}</span>
                  {isOccupied && customer.name && (
                    <span className="font-caption text-[10px] text-on-surface-variant truncate max-w-full">
                      {customer.name}
                    </span>
                  )}
                  {isOccupied && isPaused ? (
                    <span className="px-2 py-0.5 rounded-full bg-warn-tint text-warn font-caption text-[11px]">Paused</span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-full ${style.badge} font-caption text-[11px]`}>{style.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
