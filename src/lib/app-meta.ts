/**
 * This app's identity, in ONE place — the installable manifest and the share card
 * (Open Graph) read it (App Excellence Standard E11). The tab title stays in layout.tsx.
 */
export const APP_META = {
  name:        'TEC Zone',
  shortName:   'Zone',
  description: 'TEC Zone — verified trust for the Pi ecosystem. What can be trusted?',
  /** The page background — `--tec-bg` (#050816, C-83 layer 1); also the browser chrome and splash colour. */
  themeColor:  '#050816',
} as const;
