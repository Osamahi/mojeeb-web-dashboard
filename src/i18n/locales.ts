export const LOCALES = ['en', 'ar-SA', 'ar-EG'] as const;

// Type for supported locales
export type Locale = (typeof LOCALES)[number];

// Locale loaders for dynamic imports
export const localeLoaders: Record<string, () => Promise<any>> = {
  'en': () => import('./locales/en.json'),
  'ar-SA': () => import('./locales/ar-SA.json'),
  'ar-EG': () => import('./locales/ar-EG.json'),
};

// Type guard to check if a string is a valid locale
export function isValidLocale(lng: string): lng is Locale {
  return LOCALES.includes(lng as Locale);
}
