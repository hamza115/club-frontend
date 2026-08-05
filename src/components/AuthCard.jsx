export default function AuthCard({ title, subtitle, description, icon: IconComponent, children, footer }) {
  return (
    <div className="bg-paper rounded-card p-xl shadow-sm border border-outline-variant">
      {/* Header */}
      <div className="text-center mb-xl">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-container-low border border-outline-variant mb-md">
          <IconComponent size={24} strokeWidth={1.8} className="text-on-surface" />
        </div>
        <h1 className="font-headline md:font-headline-mobile text-headline md:text-headline-mobile text-on-surface mb-xs tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <h2 className="font-title-lg text-title-lg text-on-surface mb-xs">{subtitle}</h2>
        )}
        {description && (
          <p className="font-body text-body text-on-surface-variant">{description}</p>
        )}
      </div>

      {/* Content */}
      {children}

      {/* Footer */}
      {footer && (
        <div className="mt-lg text-center">
          {footer}
        </div>
      )}
    </div>
  );
}
