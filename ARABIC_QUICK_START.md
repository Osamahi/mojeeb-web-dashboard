# Arabic-Indic Numerals - Quick Start Guide

> **Status**: ✅ Fully Implemented - Ready to Use
> **Last Updated**: December 28, 2025

---

## Overview

All numbers throughout the Mojeeb Dashboard now **automatically** display in Arabic-Indic numerals (٠-٩) when the language is set to Arabic (ar-SA or ar-EG).

---

## 3 Ways to Use

### 1. **Text Component** (Recommended for Simple Cases)

Wrap any content containing numbers:

```tsx
import { Text } from '@/components/ui/Text';

function MyComponent({ count }) {
  return (
    <div>
      {/* Automatic conversion - zero manual work */}
      <Text>Total: {count}</Text>
      {/* English: "Total: 123" */}
      {/* Arabic:  "Total: ١٢٣" */}
    </div>
  );
}
```

**Additional Features:**
```tsx
// Custom HTML tag
<Text as="h1">Count: {count}</Text>

// Force Arabic even in English
<Text forceArabic>ID: {id}</Text>

// Disable conversion
<Text noConvert>{technicalId}</Text>

// With className
<Text className="font-bold">Total: {total}</Text>
```

**Convenience Components:**
```tsx
import { TextP, TextH1, TextH2, TextDiv } from '@/components/ui/Text';

<TextP>Paragraph with numbers: 123</TextP>
<TextH1>Heading with count: {count}</TextH1>
```

---

### 2. **useArabicText Hook** (For Inline Text)

For dynamic strings or template literals:

```tsx
import { useArabicText } from '@/hooks/useArabicText';

function MyComponent({ userId, count }) {
  const { toArabic } = useArabicText();

  return (
    <div>
      {/* Template literal with numbers */}
      <p>{toArabic(`User #${userId} has ${count} items`)}</p>
      {/* English: "User #42 has 123 items" */}
      {/* Arabic:  "User #٤٢ has ١٢٣ items" */}

      {/* Inline calculation */}
      <p>{toArabic(`Total: ${price * quantity}`)}</p>
    </div>
  );
}
```

**All Hook Functions:**
```tsx
const {
  toArabic,      // Auto-converts based on language
  forceArabic,   // Always converts to Arabic numerals
  forceWestern,  // Always keeps Western numerals
  isArabic,      // Boolean: is current language Arabic?
  language       // Current language code
} = useArabicText();
```

---

### 3. **Number Formatting Hooks** (For Formatted Numbers)

For currency, percentages, and formatted numbers:

```tsx
import { useNumber } from '@/lib/numberConfig';

function StatsCard({ price, rating, views, successRate }) {
  const { formatCurrency, formatDecimal, formatCompact, formatPercent } = useNumber();

  return (
    <div>
      {/* Currency */}
      <p>{formatCurrency(price)}</p>
      {/* English: "$99.99" */}
      {/* Arabic (ar-EG): "٩٩٫٩٩ ج.م." */}

      {/* Decimal with precision */}
      <p>Rating: {formatDecimal(rating, 1)}</p>
      {/* English: "Rating: 4.5" */}
      {/* Arabic:  "Rating: ٤٫٥" */}

      {/* Compact notation */}
      <p>Views: {formatCompact(views)}</p>
      {/* English: "Views: 1.5K" */}
      {/* Arabic:  "Views: ١٫٥ ألف" */}

      {/* Percentage */}
      <p>Success: {formatPercent(successRate)}</p>
      {/* English: "Success: 85%" */}
      {/* Arabic:  "Success: ٨٥٪" */}
    </div>
  );
}
```

---

## Real-World Examples

### Example 1: Agent Card with Count

```tsx
import { Text } from '@/components/ui/Text';

function AgentCard({ agent, conversationCount }) {
  return (
    <div>
      <h3>{agent.name}</h3>
      <Text>Conversations: {conversationCount}</Text>
      {/* Automatic: ١٢٣ in Arabic, 123 in English */}
    </div>
  );
}
```

### Example 2: Lead List with IDs

```tsx
import { useArabicText } from '@/hooks/useArabicText';

function LeadRow({ lead }) {
  const { toArabic } = useArabicText();

  return (
    <tr>
      <td>{toArabic(`#${lead.id}`)}</td>
      {/* #٤٢ in Arabic, #42 in English */}
      <td>{lead.name}</td>
    </tr>
  );
}
```

### Example 3: Dashboard Statistics

```tsx
import { useNumber } from '@/lib/numberConfig';
import { Text } from '@/components/ui/Text';

function Dashboard({ stats }) {
  const { formatCompact, formatPercent } = useNumber();

  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <Text className="text-sm text-neutral-500">Total Users</Text>
        <p className="text-2xl font-bold">{formatCompact(stats.totalUsers)}</p>
        {/* ١٫٢ ألف in Arabic, 1.2K in English */}
      </div>

      <div>
        <Text className="text-sm text-neutral-500">Active Rate</Text>
        <p className="text-2xl font-bold">{formatPercent(stats.activeRate)}</p>
        {/* ٨٥٪ in Arabic, 85% in English */}
      </div>

      <div>
        <Text className="text-sm text-neutral-500">Page Views Today</Text>
        <Text as="p" className="text-2xl font-bold">{stats.pageViewsToday}</Text>
        {/* ١٢٣٤٥ in Arabic, 12345 in English */}
      </div>
    </div>
  );
}
```

### Example 4: Pricing Table

```tsx
import { useNumber } from '@/lib/numberConfig';

function PricingCard({ plan }) {
  const { formatCurrency, formatInt } = useNumber();

  return (
    <div>
      <h3>{plan.name}</h3>
      <p className="text-3xl font-bold">{formatCurrency(plan.price)}</p>
      {/* ٩٩٫٩٩ ج.م. in Arabic, $99.99 in English */}

      <ul>
        <li>{formatInt(plan.maxAgents)} agents</li>
        {/* ٥ agents in Arabic, 5 agents in English */}
      </ul>
    </div>
  );
}
```

---

## Decision Guide: Which Method to Use?

| Scenario | Use This | Example |
|----------|----------|---------|
| Simple static text with numbers | `<Text>` component | `<Text>Count: 42</Text>` |
| Template literals with variables | `useArabicText()` hook | `toArabic(\`User #${id}\`)` |
| Currency, prices | `formatCurrency()` | `formatCurrency(99.99)` |
| Percentages | `formatPercent()` | `formatPercent(0.85)` |
| Large numbers (K, M) | `formatCompact()` | `formatCompact(1500)` |
| Precise decimals | `formatDecimal()` | `formatDecimal(3.14, 2)` |
| Counts, IDs | `formatInt()` or `<Text>` | `formatInt(42)` |

---

## What's Already Handled

✅ **Dates** - All date formatting automatically uses Arabic-Indic numerals
✅ **Numbers in `dateConfig.ts`** - All date functions have fallback conversion
✅ **Numbers in `numberConfig.ts`** - All number functions have fallback conversion
✅ **Browser Compatibility** - Intl API with string conversion fallback

---

## Migration Guide

### Before (No Conversion)
```tsx
<p>Total: {count}</p>                    // Shows: Total: 123 (always Western)
<p>Price: ${price}</p>                   // Shows: Price: $99 (always Western)
```

### After (Automatic Conversion)
```tsx
import { Text } from '@/components/ui/Text';
import { useNumber } from '@/lib/numberConfig';

<Text>Total: {count}</Text>              // Shows: Total: ١٢٣ (Arabic) or Total: 123 (English)

const { formatCurrency } = useNumber();
<p>{formatCurrency(price)}</p>           // Shows: ٩٩٫٩٩ ج.م. (Arabic) or $99.00 (English)
```

---

## Files Created

1. **`/src/lib/arabicNumerals.ts`** - Core conversion utility
2. **`/src/hooks/useArabicText.ts`** - React hook for text conversion
3. **`/src/components/ui/Text.tsx`** - Text wrapper component
4. **`/src/lib/dateConfig.ts`** - Updated with fallback (already working for dates)
5. **`/src/lib/numberConfig.ts`** - Updated with fallback (ready to use)

---

## Testing

All numbers will automatically convert when you:
1. Switch language to Arabic (ar-SA or ar-EG)
2. Existing components will work as-is
3. New components can use `<Text>`, `useArabicText()`, or `useNumber()`

---

**Next Steps**: Start wrapping numeric content with `<Text>` component or use the hooks in your components!
