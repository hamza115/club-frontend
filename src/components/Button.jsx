import { Loader2 } from 'lucide-react';

export default function Button({ children, loading, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-primary text-on-primary hover:bg-surface-tint focus:ring-primary border border-transparent shadow-sm',
    danger: 'bg-alert text-on-error hover:bg-red-700 focus:ring-alert',
    ghost: 'bg-transparent text-primary border border-primary hover:bg-surface-container',
  };

  return (
    <div>
      <button
        className={`w-full flex justify-center items-center py-sm px-lg rounded-full font-item-title text-item-title focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin mr-2" />
            Authenticating...
          </>
        ) : (
          children
        )}
      </button>
    </div>
  );
}
