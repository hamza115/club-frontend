/**
 * Reusable card component for entity grids (tables, staff, customers, etc.)
 *
 * Props:
 *  icon       — Lucide React component
 *  title      — primary text (e.g. "Table 01", "John Doe")
 *  subtitle   — secondary text (e.g. "PKR 500/hr", "john@mail.com")
 *  badges     — array of { label, className } rendered as pill badges
 *  details    — array of { label, value } shown as key-value rows (optional)
 *  children   — custom content between details and actions (optional)
 *  actions    — array of { label, icon: LucideComponent, onClick, variant? }
 *               variant: 'primary' | 'danger' | 'ghost' (default 'ghost')
 */
export default function EntityCard({ icon: IconComponent, title, subtitle, badges = [], details = [], children, actions = [] }) {
  return (
    <div className="bg-paper rounded-[18px] p-4 md:p-5 border border-outline-variant/20 flex flex-col hover:shadow-lg transition-shadow duration-300">
      {/* Header */}
      <div className="flex justify-between items-start gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
            <IconComponent size={22} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <h3 className="font-item-title text-item-title text-on-surface truncate">{title}</h3>
            {subtitle && (
              <p className="font-caption text-caption text-on-surface-variant truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 shrink-0">
            {badges.map((b, i) => (
              <span
                key={i}
                className={`px-2.5 py-0.5 rounded-full font-caption text-caption capitalize ${b.className}`}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      {details.length > 0 && (
        <div className="bg-surface rounded-lg px-3 py-2 mb-3 space-y-1">
          {details.map((d, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="font-caption text-caption text-on-surface-variant">{d.label}</span>
              <span className="font-caption text-caption text-on-surface truncate ml-2">{d.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Custom content */}
      {children}

      {/* Actions */}
      {actions.length > 0 && (
        <div className={`grid gap-2 mt-auto pt-3 border-t border-outline-variant/10 ${
          actions.length === 1 ? 'grid-cols-1' : actions.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
        }`}>
          {actions.map((a, i) => {
            const variants = {
              primary: 'bg-primary text-on-primary hover:bg-surface-tint',
              danger: 'bg-alert-tint text-alert hover:opacity-80',
              ghost: 'bg-surface text-on-surface hover:bg-surface-container-high',
            };
            const ActionIcon = a.icon;
            return (
              <button
                key={i}
                onClick={a.onClick}
                className={`px-2 py-2 rounded-full ${variants[a.variant || 'ghost']} transition-colors font-item-title text-item-title flex justify-center items-center gap-1 min-w-0`}
              >
                {ActionIcon && <ActionIcon size={15} strokeWidth={1.8} className="shrink-0" />}
                <span className="truncate">{a.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
