import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useTranslation } from 'react-i18next';
import type { Mock } from 'vitest';
import { useDocumentTitle } from './useDocumentTitle';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

describe('useDocumentTitle', () => {
  const mockT = vi.fn((key: string) => {
    // Simple mock translations
    const translations: Record<string, string> = {
      'pages.title_agents': 'AI Agents',
      'pages.title_settings': 'Settings',
      'pages.title_login': 'Login',
    };
    return translations[key] || key;
  });

  const mockUseTranslation = useTranslation as Mock;

  beforeEach(() => {
    // Reset document.title before each test
    document.title = '';

    // Reset mocks and restore original implementation
    mockT.mockClear();
    mockT.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        'pages.title_agents': 'AI Agents',
        'pages.title_settings': 'Settings',
        'pages.title_login': 'Login',
      };
      return translations[key] || key;
    });
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { language: 'en' },
    });
  });

  afterEach(() => {
    // Restore default title
    document.title = 'Mojeeb Dashboard';
  });

  describe('Basic Functionality', () => {
    it('should set document title with default suffix', () => {
      renderHook(() => useDocumentTitle('pages.title_agents'));

      expect(document.title).toBe('AI Agents | Mojeeb');
      expect(mockT).toHaveBeenCalledWith('pages.title_agents');
    });

    it('should translate the title key', () => {
      renderHook(() => useDocumentTitle('pages.title_settings'));

      expect(mockT).toHaveBeenCalledWith('pages.title_settings');
      expect(document.title).toBe('Settings | Mojeeb');
    });

    it('should handle static strings without translation', () => {
      renderHook(() =>
        useDocumentTitle('Custom Page', { translateTitle: false })
      );

      expect(mockT).not.toHaveBeenCalled();
      expect(document.title).toBe('Custom Page | Mojeeb');
    });
  });

  describe('Suffix Options', () => {
    it('should allow custom suffix', () => {
      renderHook(() =>
        useDocumentTitle('pages.title_agents', { suffix: 'Dashboard' })
      );

      expect(document.title).toBe('AI Agents | Dashboard');
    });

    it('should allow disabling suffix', () => {
      renderHook(() =>
        useDocumentTitle('pages.title_login', { suffix: false })
      );

      expect(document.title).toBe('Login');
    });

    it('should use default suffix when not specified', () => {
      renderHook(() => useDocumentTitle('pages.title_agents'));

      expect(document.title).toContain('Mojeeb');
    });
  });

  describe('Prefix Options', () => {
    it('should add prefix when provided', () => {
      renderHook(() =>
        useDocumentTitle('pages.title_agents', { prefix: 'Admin' })
      );

      expect(document.title).toBe('Admin | AI Agents | Mojeeb');
    });

    it('should handle prefix with custom suffix', () => {
      renderHook(() =>
        useDocumentTitle('pages.title_settings', {
          prefix: 'SuperAdmin',
          suffix: 'Dashboard',
        })
      );

      expect(document.title).toBe('SuperAdmin | Settings | Dashboard');
    });

    it('should handle prefix without suffix', () => {
      renderHook(() =>
        useDocumentTitle('pages.title_agents', {
          prefix: 'Admin',
          suffix: false,
        })
      );

      expect(document.title).toBe('Admin | AI Agents');
    });
  });

  describe('Language Change Handling', () => {
    it('should update title when language changes', () => {
      const { rerender } = renderHook(() =>
        useDocumentTitle('pages.title_agents')
      );

      expect(document.title).toBe('AI Agents | Mojeeb');

      // Simulate language change to Arabic
      mockUseTranslation.mockReturnValue({
        t: vi.fn(() => 'الوكلاء الذكيون'),
        i18n: { language: 'ar-SA' },
      });

      rerender();

      expect(document.title).toBe('الوكلاء الذكيون | Mojeeb');
    });
  });

  describe('Cleanup', () => {
    it('should restore default title on unmount', () => {
      const { unmount } = renderHook(() =>
        useDocumentTitle('pages.title_agents')
      );

      expect(document.title).toBe('AI Agents | Mojeeb');

      unmount();

      expect(document.title).toBe('Mojeeb Dashboard');
    });

    it('should restore default title even with custom suffix', () => {
      const { unmount } = renderHook(() =>
        useDocumentTitle('pages.title_agents', { suffix: 'Custom' })
      );

      expect(document.title).toBe('AI Agents | Custom');

      unmount();

      expect(document.title).toBe('Mojeeb Dashboard');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title string', () => {
      renderHook(() => useDocumentTitle(''));

      expect(document.title).toBe('| Mojeeb');
    });

    it('should handle missing translation key', () => {
      mockT.mockImplementation((key) => key); // Return key if not found

      renderHook(() => useDocumentTitle('pages.title_nonexistent'));

      expect(document.title).toBe('pages.title_nonexistent | Mojeeb');
    });

    it('should update when options change', () => {
      const { rerender } = renderHook(
        ({ options }) => useDocumentTitle('pages.title_agents', options),
        {
          initialProps: { options: { suffix: 'Dashboard' } },
        }
      );

      expect(document.title).toBe('AI Agents | Dashboard');

      rerender({ options: { suffix: false } });

      expect(document.title).toBe('AI Agents');
    });
  });
});
