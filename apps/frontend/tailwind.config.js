/** @type {import('tailwindcss').Config} */
export default {
  presets: [require('@pramana/config/tailwind-preset')],
  // The shared component package must be scanned too, or its classes are purged.
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui-components/src/**/*.{ts,tsx}',
  ],
};
