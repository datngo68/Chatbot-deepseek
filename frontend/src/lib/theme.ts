export const THEME_OPTIONS = [
  { value: 'light' as const, label: 'Light' },
  { value: 'dark' as const, label: 'Dark' },
  { value: 'system' as const, label: 'System' }
] as const;

export type ThemeMode = 'light' | 'dark' | 'system';