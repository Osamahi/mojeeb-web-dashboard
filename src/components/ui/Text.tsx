/**
 * Text Component with Automatic Arabic-Indic Numeral Conversion
 *
 * A wrapper component that automatically converts Western numerals (0-9)
 * to Arabic-Indic numerals (٠-٩) when the language is Arabic.
 *
 * Usage:
 * ```tsx
 * import { Text } from '@/components/ui/Text';
 *
 * // Simple usage
 * <Text>Count: 123</Text>           // "Count: ١٢٣" in Arabic
 *
 * // With custom tag
 * <Text as="h1">Total: 42</Text>    // <h1>Total: ٤٢</h1> in Arabic
 *
 * // With className
 * <Text className="font-bold">ID: 999</Text>
 *
 * // With children as number
 * <Text>{count}</Text>               // Converts number to string automatically
 * ```
 */

import { ReactNode } from 'react';
import { useArabicText } from '@/hooks/useArabicText';

interface TextProps {
  /** Content to display (will be converted automatically) */
  children: ReactNode;

  /** HTML tag to use (default: 'span') */
  as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label' | 'td' | 'th' | 'li';

  /** Additional CSS classes */
  className?: string;

  /** Force Arabic numerals even in English */
  forceArabic?: boolean;

  /** Disable automatic conversion (passthrough) */
  noConvert?: boolean;

  /** Additional HTML attributes */
  [key: string]: any;
}

/**
 * Text component that automatically converts numerals based on language
 */
export function Text({
  children,
  as: Tag = 'span',
  className = '',
  forceArabic = false,
  noConvert = false,
  ...props
}: TextProps) {
  const { toArabic, forceArabic: forceArabicFn } = useArabicText();

  // Convert children to string if needed
  const textContent = children?.toString() || '';

  // Determine which conversion to use
  let displayText = textContent;
  if (!noConvert) {
    if (forceArabic) {
      displayText = forceArabicFn(textContent);
    } else {
      displayText = toArabic(textContent);
    }
  }

  return (
    <Tag className={className} {...props}>
      {displayText}
    </Tag>
  );
}

/**
 * Convenience components for common use cases
 */

export const TextP = (props: Omit<TextProps, 'as'>) => <Text as="p" {...props} />;
export const TextDiv = (props: Omit<TextProps, 'as'>) => <Text as="div" {...props} />;
export const TextH1 = (props: Omit<TextProps, 'as'>) => <Text as="h1" {...props} />;
export const TextH2 = (props: Omit<TextProps, 'as'>) => <Text as="h2" {...props} />;
export const TextH3 = (props: Omit<TextProps, 'as'>) => <Text as="h3" {...props} />;
export const TextLabel = (props: Omit<TextProps, 'as'>) => <Text as="label" {...props} />;
