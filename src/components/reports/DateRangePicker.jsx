import { useState } from 'react';

const PERIODS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
  { key: 'custom', label: 'Custom' },
];

export default function DateRangePicker({ value, onChange }) {
  const [customStart, setCustomStart] = useState(value?.start || '');
  const [customEnd, setCustomEnd] = useState(value?.end || '');

  const period = value?.type || 'monthly';

  const handlePeriodChange = (type) => {
    if (type === 'custom') {
      onChange({ type: 'custom', start: customStart, end: customEnd });
    } else {
      onChange({ type });
    }
  };

  const handleCustomStart = (val) => {
    setCustomStart(val);
    if (val && customEnd) {
      onChange({ type: 'custom', start: val, end: customEnd });
    }
  };

  const handleCustomEnd = (val) => {
    setCustomEnd(val);
    if (customStart && val) {
      onChange({ type: 'custom', start: customStart, end: val });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex bg-surface-container rounded-xl p-1 gap-1">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => handlePeriodChange(p.key)}
            className={`px-3 py-1.5 rounded-lg font-caption text-caption transition-all ${
              period === p.key
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => handleCustomStart(e.target.value)}
            className="bg-paper border border-outline-variant/30 rounded-lg px-3 py-1.5 font-caption text-caption text-on-surface focus:outline-none focus:border-primary"
          />
          <span className="text-on-surface-variant">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => handleCustomEnd(e.target.value)}
            className="bg-paper border border-outline-variant/30 rounded-lg px-3 py-1.5 font-caption text-caption text-on-surface focus:outline-none focus:border-primary"
          />
        </div>
      )}
    </div>
  );
}
