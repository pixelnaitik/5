export interface ThemeOption {
  id: string;
  name: string;
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  onSecondary: string;
  previewColor: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'navy',
    name: 'Classic Navy',
    primary: '#00263f',
    primaryContainer: '#0b3c5d',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#7fa7cd',
    secondary: '#006a66',
    secondaryContainer: '#84f2eb',
    onSecondary: '#ffffff',
    previewColor: '#0b3c5d'
  },
  {
    id: 'teal',
    name: 'Clinical Teal',
    primary: '#064e3b',
    primaryContainer: '#0f766e',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#a7f3d0',
    secondary: '#0d9488',
    secondaryContainer: '#ccfbf1',
    onSecondary: '#ffffff',
    previewColor: '#0f766e'
  },
  {
    id: 'amethyst',
    name: 'Royal Amethyst',
    primary: '#311042',
    primaryContainer: '#581c87',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#e9d5ff',
    secondary: '#7e22ce',
    secondaryContainer: '#f3e8ff',
    onSecondary: '#ffffff',
    previewColor: '#581c87'
  },
  {
    id: 'slate',
    name: 'Slate Charcoal',
    primary: '#1e293b',
    primaryContainer: '#334155',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#cbd5e1',
    secondary: '#475569',
    secondaryContainer: '#f1f5f9',
    onSecondary: '#ffffff',
    previewColor: '#334155'
  },
  {
    id: 'maroon',
    name: 'Hematology Red',
    primary: '#4c0519',
    primaryContainer: '#881337',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#fecdd3',
    secondary: '#b91c1c',
    secondaryContainer: '#fee2e2',
    onSecondary: '#ffffff',
    previewColor: '#881337'
  }
];

export function applyTheme(themeId: string) {
  const theme = THEME_OPTIONS.find(t => t.id === themeId) || THEME_OPTIONS[0];
  const root = document.documentElement;
  
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--primary-container', theme.primaryContainer);
  root.style.setProperty('--on-primary', theme.onPrimary);
  root.style.setProperty('--on-primary-container', theme.onPrimaryContainer);
  root.style.setProperty('--secondary', theme.secondary);
  root.style.setProperty('--secondary-container', theme.secondaryContainer);
  root.style.setProperty('--on-secondary', theme.onSecondary);
}
