/**
 * Shared Tailwind preset. Every app extends this and adds nothing to `theme`
 * beyond `content` globs.
 *
 * Every value here is a `var(--token)` reference into tokens.css - the preset
 * does not restate hex values, so there is exactly one place a colour can
 * change. Tailwind's default palette is fully replaced so that a stray
 * `bg-green-500` or `rounded-md` fails at build time rather than shipping.
 */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      ink: 'var(--ink)',
      'ink-2': 'var(--ink-2)',
      'ink-3': 'var(--ink-3)',
      canvas: 'var(--canvas)',
      'canvas-2': 'var(--canvas-2)',
      surface: 'var(--surface)',
      muted: 'var(--muted)',
      line: 'var(--line)',
      'line-2': 'var(--line-2)',
      seal: 'var(--seal)',
      'seal-light': 'var(--seal-light)',
      'seal-wash': 'var(--seal-wash)',
      tourmaline: 'var(--tourmaline)',
      'tourmaline-wash': 'var(--tourmaline-wash)',
      amber: 'var(--amber)',
      'amber-wash': 'var(--amber-wash)',
      scarlet: 'var(--scarlet)',
      'scarlet-wash': 'var(--scarlet-wash)',
      /* QR modules must render true black on white in both themes (SS4). */
      'qr-black': '#000000',
      'qr-white': '#FFFFFF',
    },
    borderRadius: {
      none: '0',
      control: 'var(--radius-control)',
      button: 'var(--radius-button)',
      card: 'var(--radius-card)',
      hero: 'var(--radius-hero)',
      full: 'var(--radius-full)',
    },
    boxShadow: {
      none: 'none',
      primary: 'var(--shadow-primary)',
    },
    spacing: {
      0: '0px',
      1: 'var(--space-1)',
      2: 'var(--space-2)',
      3: 'var(--space-3)',
      4: 'var(--space-4)',
      5: 'var(--space-5)',
      6: 'var(--space-6)',
      7: 'var(--space-7)',
      8: 'var(--space-8)',
      9: 'var(--space-9)',
      touch: 'var(--touch-min)',
      rail: 'var(--rail-width)',
      px: '1px',
    },
    fontFamily: {
      document: 'var(--font-document)',
      ui: 'var(--font-ui)',
      mono: 'var(--font-mono)',
    },
    fontSize: {
      'title-lg': ['var(--text-title-lg)', { lineHeight: 'var(--leading-title)' }],
      title: ['var(--text-title)', { lineHeight: 'var(--leading-title)' }],
      'title-sm': ['var(--text-title-sm)', { lineHeight: 'var(--leading-title)' }],
      body: ['var(--text-body)', { lineHeight: 'var(--leading-body)' }],
      'body-sm': ['var(--text-body-sm)', { lineHeight: 'var(--leading-body)' }],
      caption: ['var(--text-caption)', { lineHeight: 1.45 }],
      mono: ['var(--text-mono)', { lineHeight: 1.45 }],
    },
    transitionTimingFunction: {
      out: 'var(--ease-out)',
      in: 'var(--ease-in)',
      seal: 'var(--ease-seal)',
      smooth: 'var(--ease-smooth)',
    },
    transitionDuration: {
      instant: 'var(--dur-instant)',
      quick: 'var(--dur-quick)',
      base: 'var(--dur-base)',
      slow: 'var(--dur-slow)',
      fill: 'var(--dur-fill)',
    },
    extend: {
      maxWidth: {
        content: 'var(--content-max)',
        field: 'var(--measure-field)',
        measure: 'var(--measure-body)',
      },
      /* SS6: named breakpoints, only for the layout-SHAPE changes that fluid
         CSS cannot express. Prefer clamp() and auto-fit grids over these. */
      screens: {
        sm: '640px',   /* two columns where content pairs; nav becomes top bar */
        lg: '1024px',  /* the real shape change: side rail, vertical steppers  */
        xl: '1440px',  /* nothing new appears; content caps and centres        */
      },
    },
  },
  plugins: [],
};
