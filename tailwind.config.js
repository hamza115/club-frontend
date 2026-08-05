/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core
        ink: 'var(--c-ink)',
        'ink-raised': 'var(--c-ink-raised)',
        'ink-secondary': 'var(--c-ink-secondary)',
        'ink-tertiary': 'var(--c-ink-tertiary)',
        primary: 'var(--c-primary)',
        secondary: 'var(--c-secondary)',
        tertiary: 'var(--c-tertiary)',
        error: 'var(--c-error)',
        outline: 'var(--c-outline)',
        'outline-variant': 'var(--c-outline-variant)',

        // Surfaces
        background: 'var(--c-background)',
        surface: 'var(--c-surface)',
        paper: 'var(--c-paper)',
        'surface-dim': 'var(--c-surface-dim)',
        'surface-bright': 'var(--c-surface-bright)',
        'surface-variant': 'var(--c-surface-variant)',
        'surface-tint': 'var(--c-surface-tint)',
        'surface-container': 'var(--c-surface-container)',
        'surface-container-low': 'var(--c-surface-container-low)',
        'surface-container-lowest': 'var(--c-surface-container-lowest)',
        'surface-container-high': 'var(--c-surface-container-high)',
        'surface-container-highest': 'var(--c-surface-container-highest)',
        'inverse-surface': 'var(--c-inverse-surface)',
        'inverse-on-surface': 'var(--c-inverse-on-surface)',
        'inverse-primary': 'var(--c-inverse-primary)',

        // On-colors
        'on-background': 'var(--c-on-background)',
        'on-surface': 'var(--c-on-surface)',
        'on-primary': 'var(--c-on-primary)',
        'on-secondary': 'var(--c-on-secondary)',
        'on-tertiary': 'var(--c-on-tertiary)',
        'on-error': 'var(--c-on-error)',
        'on-surface-variant': 'var(--c-on-surface-variant)',
        'on-secondary-container': 'var(--c-on-secondary-container)',
        'on-error-container': 'var(--c-on-error-container)',

        // Containers
        'primary-container': 'var(--c-primary-container)',
        'secondary-container': 'var(--c-secondary-container)',
        'tertiary-container': 'var(--c-tertiary-container)',
        'error-container': 'var(--c-error-container)',

        // Fixed
        'primary-fixed': 'var(--c-primary-fixed)',
        'primary-fixed-dim': 'var(--c-primary-fixed-dim)',
        'secondary-fixed': 'var(--c-secondary-fixed)',
        'secondary-fixed-dim': 'var(--c-secondary-fixed-dim)',
        'tertiary-fixed': 'var(--c-tertiary-fixed)',
        'tertiary-fixed-dim': 'var(--c-tertiary-fixed-dim)',

        // On-fixed
        'on-primary-fixed': 'var(--c-on-primary-fixed)',
        'on-primary-fixed-variant': 'var(--c-on-primary-fixed-variant)',
        'on-secondary-fixed': 'var(--c-on-secondary-fixed)',
        'on-secondary-fixed-variant': 'var(--c-on-secondary-fixed-variant)',
        'on-tertiary-fixed': 'var(--c-on-tertiary-fixed)',
        'on-tertiary-fixed-variant': 'var(--c-on-tertiary-fixed-variant)',
        'on-primary-container': 'var(--c-on-primary-container)',
        'on-tertiary-container': 'var(--c-on-tertiary-container)',

        // Status
        'status-good': 'var(--c-status-good)',
        'status-good-tint': 'var(--c-status-good-tint)',
        'status-data': 'var(--c-status-data)',
        'status-data-tint': 'var(--c-status-data-tint)',
        'status-warn': 'var(--c-status-warn)',
        'status-warn-tint': 'var(--c-status-warn-tint)',
        'status-alert': 'var(--c-status-alert)',
        'status-alert-tint': 'var(--c-status-alert-tint)',
        'live-indicator': 'var(--c-live-indicator)',

        // Aliases
        alert: 'var(--c-status-alert)',
        'alert-tint': 'var(--c-status-alert-tint)',
        good: 'var(--c-status-good)',
        'good-tint': 'var(--c-status-good-tint)',
        data: 'var(--c-status-data)',
        'data-tint': 'var(--c-status-data-tint)',
        warn: 'var(--c-status-warn)',
        'warn-tint': 'var(--c-status-warn-tint)',
        live: 'var(--c-live-indicator)',

        // Tints
        'primary-tint': 'var(--c-primary-tint)',
      },
      borderRadius: {
        card: '18px',
        input: '14px',
      },
      fontFamily: {
        sans: ['Schibsted Grotesk', 'system-ui', 'sans-serif'],
        display: ['Schibsted Grotesk', 'system-ui', 'sans-serif'],
        body: ['Schibsted Grotesk', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['66px', { lineHeight: '68px', letterSpacing: '-0.04em', fontWeight: '700' }],
        headline: ['44px', { lineHeight: '48px', letterSpacing: '-0.03em', fontWeight: '700' }],
        'headline-mobile': ['32px', { lineHeight: '36px', letterSpacing: '-0.03em', fontWeight: '700' }],
        'title-lg': ['23px', { lineHeight: '28px', letterSpacing: '-0.02em', fontWeight: '700' }],
        title: ['23px', { lineHeight: '28px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'item-title': ['14.5px', { lineHeight: '20px', fontWeight: '600' }],
        body: ['14px', { lineHeight: '22px', fontWeight: '400' }],
        caption: ['12.5px', { lineHeight: '18px', fontWeight: '400' }],
      },
      fontWeight: {
        headline: '700',
        'title-lg': '700',
      },
      spacing: {
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '40px',
        base: '4px',
        gutter: '40px',
        'card-padding': '22px',
        'card-padding-sm': '16px',
        'margin-mobile': '20px',
        'screen-gutter-mobile': '20px',
      },
    },
  },
  plugins: [],
};
