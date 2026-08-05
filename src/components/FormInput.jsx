import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function FormInput({ label, icon: IconComponent, type = 'text', error, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div>
      <label className="block font-item-title text-item-title text-on-surface-variant mb-xs">
        {label}
      </label>
      <div className="relative">
        {IconComponent && (
          <div className="absolute inset-y-0 left-0 pl-sm flex items-center pointer-events-none">
            <IconComponent size={18} strokeWidth={1.8} className="text-outline" />
          </div>
        )}
        <input
          type={inputType}
          className={`block w-full ${IconComponent ? 'pl-xl' : 'pl-sm'} ${isPassword ? 'pr-xl' : 'pr-sm'} py-sm bg-surface-container-lowest border ${error ? 'border-alert' : 'border-outline-variant'} rounded-input text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-sm flex items-center text-outline hover:text-on-surface transition-colors"
          >
            {showPassword ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
          </button>
        )}
      </div>
      {error && (
        <p className="font-caption text-caption text-error mt-xs">{error}</p>
      )}
    </div>
  );
}
