import { CircleX, CheckCircle2, TriangleAlert, X } from 'lucide-react';

export default function Toast({ message, type = 'error', onClose }) {
  const styles = {
    error: 'bg-error-container text-on-error-container border-error/20 shadow-xl',
    success: 'bg-good-tint text-good border-good/20',
    warning: 'bg-warn-tint text-warn border-warn/20',
  };

  const icons = {
    error: CircleX,
    success: CheckCircle2,
    warning: TriangleAlert,
  };

  if (!message) return null;

  const Icon = icons[type] || CircleX;

  return (
    <div className={`mb-md ${styles[type]} p-sm rounded-lg flex items-center gap-sm border transition-all duration-200 ease-out`}>
      <Icon size={18} strokeWidth={1.8} />
      <p className="font-body text-body flex-1">{message}</p>
      {onClose && (
        <button onClick={onClose} className="ml-xs text-current opacity-60 hover:opacity-100">
          <X size={16} strokeWidth={1.8} />
        </button>
      )}
    </div>
  );
}
