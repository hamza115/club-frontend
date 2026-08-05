export function PanelCard({ title, action, children, className = '' }) {
  return (
    <section className={`bg-surface rounded-[24px] p-4 md:p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-4 md:mb-5">
          {title ? <h3 className="font-title text-[20px] md:text-title text-primary">{title}</h3> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function MetricCard({ label, value, icon: IconComponent, accent, note, className = '' }) {
  return (
    <div className={`bg-paper rounded-[22px] p-3.5 md:p-4 border border-outline-variant/20 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`h-10 w-10 md:h-11 md:w-11 rounded-2xl flex items-center justify-center ${accent?.bg || 'bg-surface-container'}`}>
          <IconComponent size={20} strokeWidth={1.8} className={accent?.text || 'text-on-surface-variant'} />
        </div>
        {note ? (
          <span className={`px-2.5 py-1 rounded-full font-caption text-[11px] md:text-caption ${accent?.pill || 'bg-surface-container text-on-surface-variant'}`}>
            {note}
          </span>
        ) : null}
      </div>
      <div className="mt-6 md:mt-7">
        <p className="font-caption text-[11px] md:text-caption text-on-surface-variant mb-1">{label}</p>
        <p className="font-title text-[20px] md:text-title text-on-background leading-tight">{value}</p>
      </div>
    </div>
  );
}

export function StatusBadge({ tone = 'neutral', children }) {
  const tones = {
    neutral: 'bg-surface-container text-on-surface-variant',
    success: 'bg-good-tint text-good',
    warn: 'bg-warn-tint text-warn',
    alert: 'bg-alert-tint text-alert',
    data: 'bg-data-tint text-data',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-caption text-caption ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon: IconComponent, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 md:py-14 text-center">
      <div className="h-12 w-12 rounded-full bg-surface-container flex items-center justify-center mb-3">
        <IconComponent size={22} strokeWidth={1.8} className="text-on-surface-variant" />
      </div>
      <p className="font-item-title text-[13px] md:text-item-title text-on-surface mb-1">{title}</p>
      <p className="font-body text-[13px] md:text-body text-on-surface-variant max-w-sm">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
