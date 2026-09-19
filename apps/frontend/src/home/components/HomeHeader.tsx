import { Icon, SealMark, useTheme } from '@pramana/ui-components';

export function HomeHeader() {
  const { resolved, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-line-2 bg-canvas/90 px-4 py-2 backdrop-blur-[10px]">
      <div className="flex min-h-touch items-center gap-3">
        <SealMark size={26} />
        <span className="font-document text-title-sm font-semibold">Pramāṇa</span>
      </div>

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
        aria-label={resolved === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'}
        className="inline-flex size-touch items-center justify-center rounded-control text-ink-3 hover:bg-canvas-2"
      >
        <Icon name={resolved === 'dark' ? 'sun' : 'moon'} />
      </button>
    </header>
  );
}
