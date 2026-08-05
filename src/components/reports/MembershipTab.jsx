import { useState, useEffect } from 'react';
import { Heart, Users, UserX, UserPlus, CreditCard, Percent, IdCard, History, CircleX, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { StatCard, SectionCard, DataTable, Badge, PKR, formatPercent, formatDate } from './shared';

const STAT_CARDS = [
  { key: 'totalPlans', label: 'Total Plans', icon: Heart },
  { key: 'activeMembers', label: 'Active Members', icon: Users },
  { key: 'expiredMembers', label: 'Expired Members', icon: UserX },
  { key: 'noMembership', label: 'No Membership', icon: UserPlus },
  { key: 'membershipRevenue', label: 'Membership Revenue', icon: CreditCard, format: PKR },
  { key: 'discountsGiven', label: 'Discounts Given', icon: Percent },
];

const PLANS_COLUMNS = [
  { key: 'name', label: 'Name' },
  {
    key: 'tier',
    label: 'Tier',
    render: (r) => {
      const variant = { silver: 'default', gold: 'primary', vip: 'warning' }[r.tier] || 'default';
      return <Badge variant={variant}>{r.tier}</Badge>;
    },
  },
  {
    key: 'discount',
    label: 'Discount %',
    render: (r) => formatPercent(r.discount),
  },
  {
    key: 'validityDays',
    label: 'Validity',
    render: (r) => (r.validityDays ? `${r.validityDays} days` : '—'),
  },
  {
    key: 'price',
    label: 'Price',
    render: (r) => PKR(r.price),
  },
  {
    key: 'isActive',
    label: 'Active',
    render: (r) => (
      <Badge variant={r.isActive ? 'success' : 'warning'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>
    ),
  },
];

const RENEWALS_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  {
    key: 'membership',
    label: 'Plan',
    render: (r) => r.membership?.name || '—',
  },
  {
    key: 'membershipExpiry',
    label: 'Expiry',
    render: (r) => formatDate(r.membershipExpiry),
  },
  {
    key: 'updatedAt',
    label: 'Updated',
    render: (r) => formatDate(r.updatedAt),
  },
];

export default function MembershipTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get('/reports/membership')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load membership report'))
      .finally(() => setLoading(false));
  }, []);

  const discountsDisplay = data
    ? `${PKR(data.discountsGiven?.total)} (${data.discountsGiven?.count || 0})`
    : '—';

  const statValues = {
    totalPlans: data?.totalPlans,
    activeMembers: data?.activeMembers,
    expiredMembers: data?.expiredMembers,
    noMembership: data?.noMembership,
    membershipRevenue: data?.membershipRevenue,
    discountsGiven: discountsDisplay,
  };

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="bg-alert-tint/20 text-alert font-body text-body rounded-xl p-4 flex items-center gap-2">
          <CircleX size={18} strokeWidth={1.8} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
        {STAT_CARDS.map((s) => {
          const raw = statValues[s.key];
          const display = loading ? '—' : s.format ? s.format(raw) : raw ?? '—';
          return <StatCard key={s.key} label={s.label} value={display} icon={s.icon} />;
        })}
      </div>

      <SectionCard title="Membership Plans" icon={IdCard}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable columns={PLANS_COLUMNS} rows={data?.plans || []} emptyText="No membership plans found" />
        )}
      </SectionCard>

      <SectionCard title="Recent Renewals" icon={History}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-on-surface-variant" />
          </div>
        ) : (
          <DataTable columns={RENEWALS_COLUMNS} rows={data?.recentRenewals || []} emptyText="No recent renewals" />
        )}
      </SectionCard>
    </div>
  );
}
