export function StatCard({ label, value, icon: IconComponent, tint }) {
  return (
    <div className="bg-paper rounded-xl p-4 md:p-5 flex flex-col gap-2 relative overflow-hidden">
      {tint && <div className={`absolute inset-0 ${tint} -z-10`} />}
      <div className="flex items-center gap-2">
        {IconComponent && <IconComponent size={18} strokeWidth={1.8} className="text-on-surface-variant" />}
        <span className="font-caption text-caption text-secondary">{label}</span>
      </div>
      <span className="font-title text-title text-primary">{value}</span>
    </div>
  );
}

export function SectionCard({ title, icon: IconComponent, children, action }) {
  return (
    <div className="bg-surface rounded-[18px] md:rounded-[24px] p-4 md:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {IconComponent && <IconComponent size={20} strokeWidth={1.8} className="text-on-surface-variant" />}
          <h2 className="font-item-title text-item-title text-on-surface">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function DataTable({ columns, rows, emptyText = 'No data available' }) {
  if (!rows?.length) {
    return <p className="font-body text-body text-on-surface-variant py-4 text-center">{emptyText}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-outline-variant/20">
            {columns.map((col, i) => (
              <th key={i} className="font-caption text-caption text-on-surface-variant py-3 px-3 whitespace-nowrap">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container/50 transition-colors">
              {columns.map((col, ci) => (
                <td key={ci} className="font-body text-body text-on-surface py-3 px-3 whitespace-nowrap">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-surface-container text-on-surface-variant',
    success: 'bg-good-tint/30 text-good',
    warning: 'bg-warn-tint/30 text-warn',
    danger: 'bg-alert-tint/30 text-alert',
    primary: 'bg-primary/15 text-primary',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-caption text-caption ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}

export { formatCurrency as PKR } from '../../lib/currency';

export function formatDuration(minutes) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatPercent(value) {
  if (value == null) return '0%';
  return `${Math.round(value)}%`;
}
