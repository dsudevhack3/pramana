/**
 * SS4: line icons only, 1.75 stroke, rounded caps and joins, 20-24px default.
 * Filled glyphs exist only inside status badges at 12-14px, where a filled
 * shape reads faster at small size - see `filled` below.
 *
 * This is the complete icon set for the product. Adding an icon means adding
 * it here, in the same stroke language; never import a second icon library.
 */
import { cn } from '../lib/cn';

const PATHS = {
  shield: 'M12 3l7 3v5.5c0 4.3-2.9 7.6-7 9.5-4.1-1.9-7-5.2-7-9.5V6z',
  shieldCheck: 'M12 3l7 3v5.5c0 4.3-2.9 7.6-7 9.5-4.1-1.9-7-5.2-7-9.5V6z|M9 12l2 2 4-4',
  check: 'M20 6L9 17l-5-5',
  alertTriangle: 'M12 4.5L2.8 20h18.4z|M12 10v4|M12 17.2v.1',
  x: 'M18 6L6 18|M6 6l12 12',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18z|M12 7.5V12l3 2',
  file: 'M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z|M14 3v5h5|M9 13h6|M9 17h4',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8z|M4.5 20a7.5 7.5 0 0115 0',
  users: 'M9 12a4 4 0 100-8 4 4 0 000 8z|M2.5 20a6.5 6.5 0 0113 0|M16 4.4a4 4 0 010 7.2|M17.5 14.2a6.5 6.5 0 014 5.8',
  store: 'M4 9l1.2-4.2A1.5 1.5 0 016.6 3.7h10.8a1.5 1.5 0 011.4 1.1L20 9|M4 9h16v10a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 19z|M9.5 20.5v-5h5v5',
  scan: 'M3 8V5.5A2.5 2.5 0 015.5 3H8|M16 3h2.5A2.5 2.5 0 0121 5.5V8|M21 16v2.5a2.5 2.5 0 01-2.5 2.5H16|M8 21H5.5A2.5 2.5 0 013 18.5V16|M3.5 12h17',
  key: 'M15.5 3a5.5 5.5 0 00-5.2 7.3L3 17.6V21h3.4l1-1v-2h2v-2h2l1.3-1.3A5.5 5.5 0 1015.5 3z|M17.2 7.3v.1',
  list: 'M8 6h13|M8 12h13|M8 18h13|M3.5 6v.1|M3.5 12v.1|M3.5 18v.1',
  activity: 'M3 12h4l3 8 4-16 3 8h4',
  chevronRight: 'M9 5l7 7-7 7',
  chevronDown: 'M5 9l7 7 7-7',
  chevronUp: 'M19 15l-7-7-7 7',
  arrowLeft: 'M19 12H5|M11 18l-6-6 6-6',
  sun: 'M12 17a5 5 0 100-10 5 5 0 000 10z|M12 2v2|M12 20v2|M4.2 4.2l1.5 1.5|M18.3 18.3l1.5 1.5|M2 12h2|M20 12h2|M4.2 19.8l1.5-1.5|M18.3 5.7l1.5-1.5',
  moon: 'M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z',
  lock: 'M6 10.5h12V21H6z|M8.5 10.5V7a3.5 3.5 0 017 0v3.5',
  pin: 'M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z|M12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  phone: 'M6.5 3.5h4l1.5 4-2.2 1.6a12 12 0 005.1 5.1l1.6-2.2 4 1.5v4a1.5 1.5 0 01-1.6 1.5C10.6 18.4 5.6 13.4 5 5.1a1.5 1.5 0 011.5-1.6z',
  plus: 'M12 5v14|M5 12h14',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14z|M16.2 16.2L21 21',
  hash: 'M5 9h14|M5 15h14|M10 4l-1.5 16|M15.5 4L14 20',
  copy: 'M9 9h10v12H9z|M15 5H5v12',
  building: 'M4 21V5.5A1.5 1.5 0 015.5 4h8A1.5 1.5 0 0115 5.5V21|M15 10h3.5A1.5 1.5 0 0120 11.5V21|M3 21h18|M7.5 8h4|M7.5 12h4|M7.5 16h4',
  gauge: 'M12 20a8 8 0 100-16 8 8 0 000 16z|M12 12l4-3',
  ban: 'M12 21a9 9 0 100-18 9 9 0 000 18z|M6 6l12 12',
  camera: 'M4 8h3l1.4-2.2h7.2L17 8h3v11H4z|M12 16.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7',
  link: 'M9.5 14.5l5-5|M10.5 6.5l1.4-1.4a4 4 0 115.7 5.7L16 12.2|M8 11.8l-1.6 1.4a4 4 0 105.7 5.7l1.4-1.4',
  logout: 'M15 17l5-5-5-5|M20 12H9|M9 4H5.5A1.5 1.5 0 004 5.5v13A1.5 1.5 0 005.5 20H9',
  flag: 'M5 21V4|M5 5h11l-1.6 3.5L16 12H5',
  download: 'M12 4v11|M7.5 11L12 15.5 16.5 11|M4.5 19.5h15',
  refresh: 'M20 5v5h-5|M4 19v-5h5|M19.2 10a7.5 7.5 0 00-13.2-2.6L4 10|M4.8 14a7.5 7.5 0 0013.2 2.6L20 14',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z|M12 15a3 3 0 100-6 3 3 0 000 6z',
  pill: 'M10.5 3.5a5 5 0 017 7l-7 7a5 5 0 01-7-7z|M7 7l7 7',
} as const;

/** Filled companions used only inside <Badge /> at 12-14px. */
const FILLED: Partial<Record<IconName, string>> = {
  shieldCheck: 'M12 2.2l8 3.4v6c0 4.9-3.3 8.6-8 10.6-4.7-2-8-5.7-8-10.6v-6z',
  check: 'M12 2.2a9.8 9.8 0 100 19.6 9.8 9.8 0 000-19.6z',
  clock: 'M12 2.2a9.8 9.8 0 100 19.6 9.8 9.8 0 000-19.6z',
  x: 'M12 2.2a9.8 9.8 0 100 19.6 9.8 9.8 0 000-19.6z',
  ban: 'M12 2.2a9.8 9.8 0 100 19.6 9.8 9.8 0 000-19.6z',
  alertTriangle: 'M12 3.2L1.8 21h20.4z',
};

export type IconName = keyof typeof PATHS;

export interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  /** Only for badge-scale glyphs. Ignored above 14px. */
  filled?: boolean;
  /** Supply when the icon is the only label for a control. */
  title?: string;
}

export function Icon({ name, size = 20, className, filled = false, title }: IconProps) {
  const useFilled = filled && size <= 14 && FILLED[name];
  const d = useFilled ? FILLED[name]! : PATHS[name];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn('shrink-0', className)}
      fill={useFilled ? 'currentColor' : 'none'}
      stroke={useFilled ? 'none' : 'currentColor'}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {d.split('|').map((seg) => (
        <path key={seg} d={seg} />
      ))}
    </svg>
  );
}
