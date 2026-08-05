import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmTone = 'danger',
  icon: IconComponent = AlertTriangle,
  onClose,
  onConfirm,
  loading = false,
}) {
  const confirmClasses = {
    danger: 'bg-alert text-on-primary hover:opacity-90',
    primary: 'bg-primary text-on-primary hover:bg-surface-tint',
  };

  return (
    <div className="fixed inset-0 bg-on-background/40 backdrop-blur-sm z-[100] flex items-center justify-center px-4 py-4">
      <div className="bg-paper rounded-card p-lg md:p-xl shadow-xl border border-outline-variant/20 w-full max-w-[400px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-lg">
          <div className="h-10 w-10 rounded-full bg-alert-tint text-alert flex items-center justify-center">
            <IconComponent size={20} strokeWidth={1.8} />
          </div>
          <h2 className="font-title text-title text-on-surface">{title}</h2>
        </div>
        <p className="font-body text-body text-on-surface-variant mb-lg">
          {description}
        </p>
        <div className="flex gap-sm">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-sm px-lg rounded-full bg-surface text-on-surface hover:bg-surface-container-high transition-colors font-item-title text-item-title"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-sm px-lg rounded-full transition-colors font-item-title text-item-title disabled:opacity-60 ${confirmClasses[confirmTone]}`}
          >
            {loading ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
