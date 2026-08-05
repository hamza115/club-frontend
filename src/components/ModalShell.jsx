import { X } from 'lucide-react';
import { useRef, useEffect } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/styles/overlayscrollbars.css';

export default function ModalShell({
  title,
  description,
  onClose,
  children,
  footer,
  icon: IconComponent = 'info',
  maxWidth = 'max-w-xl',
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-on-background/45 backdrop-blur-sm flex items-center justify-center px-4 py-6">
      <div className={`w-full ${maxWidth} max-h-[92vh] flex flex-col rounded-[24px] bg-paper border border-outline-variant/20 shadow-2xl p-5 md:p-6`}>
        <div className="flex items-start justify-between gap-4 mb-5 md:mb-6 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
              <IconComponent size={20} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <h3 className="font-title text-title text-on-surface">{title}</h3>
              {description ? (
                <p className="font-body text-body text-on-surface-variant mt-1">{description}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X size={22} strokeWidth={1.8} />
          </button>
        </div>

        <OverlayScrollbarsComponent
          defer
          options={{
            scrollbars: { autoHide: 'leave', autoHideDelay: 300 },
            overflow: { x: 'hidden', y: 'scroll' },
            paddingAbsolute: true,
          }}
          className="flex-1 min-h-0"
        >
          <div className="pr-2 pl-1 py-1">
            {children}
          </div>
        </OverlayScrollbarsComponent>

        {footer ? <div className="mt-6 shrink-0">{footer}</div> : null}
      </div>
    </div>
  );
}
