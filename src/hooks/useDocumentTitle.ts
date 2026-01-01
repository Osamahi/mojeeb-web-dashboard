import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Options for customizing the document title
 */
export interface UseDocumentTitleOptions {
  /**
   * Text to prepend before the title
   * @example prefix: "Admin"  → "Admin | AI Agents | Mojeeb"
   */
  prefix?: string;

  /**
   * Text to append after the title. Pass `false` to disable the default suffix.
   * @default "Mojeeb"
   * @example suffix: false  → "AI Agents"
   * @example suffix: "Dashboard"  → "AI Agents | Dashboard"
   */
  suffix?: string | false;

  /**
   * Whether to translate the title using i18n.
   * Set to `false` if you're passing a pre-translated string.
   * @default true
   */
  translateTitle?: boolean;
}

/**
 * Custom hook to set and manage the document title with i18n support.
 *
 * Features:
 * - Automatically updates on language change
 * - Supports translation keys or static strings
 * - Configurable prefix and suffix
 * - Cleans up on unmount
 *
 * @param title - Translation key (e.g., "pages.title_agents") or static string
 * @param options - Optional configuration for title formatting
 *
 * @example
 * // Simple usage with translation key
 * useDocumentTitle('pages.title_agents');
 * // Result: "AI Agents | Mojeeb" (English)
 * // Result: "الوكلاء الذكيون | مجيب" (Arabic)
 *
 * @example
 * // Custom suffix
 * useDocumentTitle('pages.title_settings', { suffix: 'Admin Panel' });
 * // Result: "Settings | Admin Panel"
 *
 * @example
 * // No suffix
 * useDocumentTitle('pages.title_login', { suffix: false });
 * // Result: "Login"
 *
 * @example
 * // With prefix (for admin pages)
 * useDocumentTitle('pages.title_users', { prefix: 'Admin' });
 * // Result: "Admin | Users | Mojeeb"
 *
 * @example
 * // Static string (no translation)
 * useDocumentTitle('Custom Page Title', { translateTitle: false });
 * // Result: "Custom Page Title | Mojeeb"
 */
export function useDocumentTitle(
  title: string,
  options?: UseDocumentTitleOptions
): void {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Determine if we should translate the title
    const shouldTranslate = options?.translateTitle ?? true;
    const titleText = shouldTranslate ? t(title) : title;

    // Build title parts
    const parts: string[] = [];

    // Add prefix if provided
    if (options?.prefix) {
      parts.push(options.prefix);
    }

    // Add main title (always present)
    parts.push(titleText);

    // Add suffix (default: "Mojeeb", unless explicitly set to false)
    if (options?.suffix !== false) {
      const suffixText = typeof options?.suffix === 'string'
        ? options.suffix
        : 'Mojeeb';
      parts.push(suffixText);
    }

    // Join with separator
    const fullTitle = parts.join(' | ');

    // Update document title
    document.title = fullTitle;

    // Cleanup: restore default title on unmount
    return () => {
      document.title = 'Mojeeb Dashboard';
    };
  }, [
    title,
    options?.prefix,
    options?.suffix,
    options?.translateTitle,
    t,
    i18n.language, // Re-run when language changes
  ]);
}
