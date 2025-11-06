import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  formatDate,
  formatRelativeTime,
  formatRelativeDate,
  truncate,
  capitalize,
  sleep,
  getInitials,
  getAvatarColor,
  isEmpty,
  debounce,
} from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('should merge tailwind classes correctly', () => {
      // twMerge should keep the last conflicting class
      expect(cn('px-2', 'px-4')).toBe('px-4');
    });

    it('should handle arrays', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('should handle objects', () => {
      expect(cn({ foo: true, bar: false })).toBe('foo');
    });

    it('should handle mixed inputs', () => {
      expect(cn('foo', { bar: true }, ['baz'])).toBe('foo bar baz');
    });
  });

  describe('formatDate', () => {
    it('should format Date object with default format', () => {
      const date = new Date('2025-01-06T12:00:00Z');
      const result = formatDate(date);
      expect(result).toBe('Jan 06, 2025');
    });

    it('should format Date object with custom format', () => {
      const date = new Date('2025-01-06T12:00:00Z');
      const result = formatDate(date, 'yyyy-MM-dd');
      expect(result).toBe('2025-01-06');
    });

    it('should format ISO string', () => {
      const result = formatDate('2025-01-06T12:00:00Z', 'MMM dd');
      expect(result).toBe('Jan 06');
    });

    it('should format timestamp number', () => {
      const timestamp = new Date('2025-01-06T12:00:00Z').getTime();
      const result = formatDate(timestamp, 'yyyy');
      expect(result).toBe('2025');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format recent dates as relative time', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      const result = formatRelativeTime(twoHoursAgo);

      expect(result).toContain('hour');
      expect(result).toContain('ago');
    });

    it('should handle Date object', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const result = formatRelativeTime(yesterday);

      expect(result).toContain('day');
      expect(result).toContain('ago');
    });

    it('should handle ISO string', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

      const result = formatRelativeTime(oneMinuteAgo.toISOString());

      expect(result).toContain('ago');
    });
  });

  describe('formatRelativeDate', () => {
    it('should format relative date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const result = formatRelativeDate(yesterday);

      expect(result).toContain('yesterday');
    });

    it('should handle Date object', () => {
      const date = new Date();
      const result = formatRelativeDate(date);

      expect(result).toContain('today');
    });

    it('should handle ISO string', () => {
      const date = new Date().toISOString();
      const result = formatRelativeDate(date);

      expect(result).toBeTruthy();
    });
  });

  describe('truncate', () => {
    it('should not truncate short strings', () => {
      expect(truncate('hello')).toBe('hello');
    });

    it('should truncate long strings with default length', () => {
      const longString = 'a'.repeat(100);
      const result = truncate(longString);

      expect(result).toHaveLength(53); // 50 chars + '...'
      expect(result.endsWith('...')).toBe(true);
    });

    it('should truncate with custom length', () => {
      const longString = 'Hello, World! This is a test.';
      const result = truncate(longString, 10);

      expect(result).toBe('Hello, Wor...');
    });

    it('should return string unchanged if exactly at length', () => {
      const str = 'exactly10!';
      expect(truncate(str, 10)).toBe('exactly10!');
    });

    it('should handle empty string', () => {
      expect(truncate('')).toBe('');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should handle already capitalized string', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });

    it('should handle single character', () => {
      expect(capitalize('a')).toBe('A');
    });

    it('should handle all caps', () => {
      expect(capitalize('HELLO')).toBe('HELLO');
    });

    it('should preserve rest of string', () => {
      expect(capitalize('hello world')).toBe('Hello world');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });
  });

  describe('sleep', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should resolve after specified time', async () => {
      const promise = sleep(1000);

      vi.advanceTimersByTime(1000);

      await expect(promise).resolves.toBeUndefined();
    });

    it('should not resolve before time elapsed', () => {
      const callback = vi.fn();
      sleep(1000).then(callback);

      vi.advanceTimersByTime(500);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should resolve exactly at specified time', async () => {
      const callback = vi.fn();
      sleep(1000).then(callback);

      vi.advanceTimersByTime(1000);
      await Promise.resolve(); // Let promise settle

      expect(callback).toHaveBeenCalledOnce();
    });
  });

  describe('getInitials', () => {
    it('should get initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('should handle single name', () => {
      expect(getInitials('John')).toBe('J');
    });

    it('should handle three names (first two)', () => {
      expect(getInitials('John Michael Doe')).toBe('JM');
    });

    it('should convert to uppercase', () => {
      expect(getInitials('john doe')).toBe('JD');
    });

    it('should handle mixed case', () => {
      expect(getInitials('JoHn DoE')).toBe('JD');
    });

    it('should handle names with extra spaces', () => {
      expect(getInitials('John  Doe')).toBe('JD');
    });

    it('should handle empty string', () => {
      expect(getInitials('')).toBe('');
    });
  });

  describe('getAvatarColor', () => {
    it('should return consistent color for same string', () => {
      const color1 = getAvatarColor('John Doe');
      const color2 = getAvatarColor('John Doe');

      expect(color1).toBe(color2);
    });

    it('should return a valid Tailwind color class', () => {
      const color = getAvatarColor('Test User');

      expect(color).toMatch(/^bg-\w+-500$/);
    });

    it('should return different colors for different strings', () => {
      const color1 = getAvatarColor('User A');
      const color2 = getAvatarColor('User B');

      // They might be the same by chance, but let's test with very different strings
      const results = new Set([
        getAvatarColor('A'),
        getAvatarColor('B'),
        getAvatarColor('C'),
        getAvatarColor('D'),
        getAvatarColor('E'),
      ]);

      // At least some should be different
      expect(results.size).toBeGreaterThan(1);
    });

    it('should handle empty string', () => {
      const color = getAvatarColor('');
      expect(color).toMatch(/^bg-\w+-500$/);
    });

    it('should handle special characters', () => {
      const color = getAvatarColor('!@#$%');
      expect(color).toMatch(/^bg-\w+-500$/);
    });
  });

  describe('isEmpty', () => {
    it('should return true for null', () => {
      expect(isEmpty(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isEmpty(undefined)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isEmpty('')).toBe(true);
    });

    it('should return true for whitespace-only string', () => {
      expect(isEmpty('   ')).toBe(true);
    });

    it('should return false for non-empty string', () => {
      expect(isEmpty('hello')).toBe(false);
    });

    it('should return true for empty array', () => {
      expect(isEmpty([])).toBe(true);
    });

    it('should return false for non-empty array', () => {
      expect(isEmpty([1, 2, 3])).toBe(false);
    });

    it('should return true for empty object', () => {
      expect(isEmpty({})).toBe(true);
    });

    it('should return false for non-empty object', () => {
      expect(isEmpty({ key: 'value' })).toBe(false);
    });

    it('should return false for number 0', () => {
      expect(isEmpty(0)).toBe(false);
    });

    it('should return false for boolean false', () => {
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should delay function execution', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 1000);

      debouncedFunc();

      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);

      expect(func).toHaveBeenCalledOnce();
    });

    it('should only call function once for multiple rapid calls', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 1000);

      debouncedFunc();
      debouncedFunc();
      debouncedFunc();

      vi.advanceTimersByTime(1000);

      expect(func).toHaveBeenCalledOnce();
    });

    it('should reset timer on each call', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 1000);

      debouncedFunc();
      vi.advanceTimersByTime(500);

      debouncedFunc(); // Reset timer
      vi.advanceTimersByTime(500);

      expect(func).not.toHaveBeenCalled(); // Still waiting

      vi.advanceTimersByTime(500);
      expect(func).toHaveBeenCalledOnce();
    });

    it('should pass arguments to debounced function', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 1000);

      debouncedFunc('arg1', 'arg2');

      vi.advanceTimersByTime(1000);

      expect(func).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should use last arguments when called multiple times', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 1000);

      debouncedFunc('first');
      debouncedFunc('second');
      debouncedFunc('third');

      vi.advanceTimersByTime(1000);

      expect(func).toHaveBeenCalledOnce();
      expect(func).toHaveBeenCalledWith('third');
    });

    it('should allow multiple executions after wait time', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 1000);

      debouncedFunc();
      vi.advanceTimersByTime(1000);

      debouncedFunc();
      vi.advanceTimersByTime(1000);

      expect(func).toHaveBeenCalledTimes(2);
    });
  });
});
