# Arabic-Indic Numerals Implementation Guide

> **Status**: ✅ Implemented (December 28, 2025)
> **Applies to**: All numbers and dates across the Mojeeb Dashboard

---

## Overview

The Mojeeb Dashboard now supports **Arabic-Indic numerals** (٠-٩) for all Arabic locales (ar-SA, ar-EG). This is implemented using native JavaScript `Intl` APIs for maximum performance and compatibility.

### What's Covered

- ✅ **Dates** - Gregorian (Miladi) dates with Arabic-Indic numerals
- ✅ **Numbers** - All numeric values (counts, IDs, statistics)
- ✅ **Currency** - Localized currency formatting
- ✅ **Percentages** - Percentage formatting
- ✅ **Compact Numbers** - Large numbers (1K, 1M, etc.)

---

## Date Formatting

### Usage in React Components

```typescript
import { useDateLocale } from '@/lib/dateConfig';

function MyComponent() {
  const { format } = useDateLocale();

  return (
    <div>
      {/* English: "Dec 28, 2025" */}
      {/* Arabic:  "٢٨ ديسمبر ٢٠٢٥" */}
      <p>{format(new Date(), 'MMM d, yyyy')}</p>
    </div>
  );
}
```

### Supported Date Formats

| Format String | English Output | Arabic Output |
|--------------|----------------|---------------|
| `'MMM d, yyyy'` | Dec 28, 2025 | ديسمبر ٢٨, ٢٠٢٥ |
| `'MMMM d, yyyy'` | December 28, 2025 | ديسمبر ٢٨, ٢٠٢٥ |
| `'PPP'` | December 28, 2025 | ديسمبر ٢٨, ٢٠٢٥ |

### In Utility Files (Non-React)

```typescript
import { getDateFns } from '@/lib/dateConfig';

const { format } = getDateFns('ar-SA');
const formattedDate = format(new Date(), 'MMM d, yyyy');
// Output: "ديسمبر ٢٨, ٢٠٢٥"
```

---

## Number Formatting

### Usage in React Components

```typescript
import { useNumber } from '@/lib/numberConfig';

function StatisticsCard() {
  const { formatNumber, formatCurrency, formatPercent, formatCompact } = useNumber();

  return (
    <div>
      {/* Basic number formatting */}
      <p>Total: {formatNumber(1234)}</p>
      {/* English: "1,234" */}
      {/* Arabic:  "١٬٢٣٤" */}

      {/* Currency formatting */}
      <p>Price: {formatCurrency(99.99)}</p>
      {/* English: "$99.99" */}
      {/* Arabic (ar-EG): "٩٩٫٩٩ ج.م." */}
      {/* Arabic (ar-SA): "٩٩٫٩٩ ر.س." */}

      {/* Percentage formatting */}
      <p>Progress: {formatPercent(0.85)}</p>
      {/* English: "85%" */}
      {/* Arabic:  "٨٥٪" */}

      {/* Compact notation */}
      <p>Views: {formatCompact(1500)}</p>
      {/* English: "1.5K" */}
      {/* Arabic:  "١٫٥ ألف" */}

      {/* Integer formatting (no decimals) */}
      <p>Count: {formatInt(42)}</p>
      {/* English: "42" */}
      {/* Arabic:  "٤٢" */}

      {/* Decimal with precision */}
      <p>Pi: {formatDecimal(3.14159, 2)}</p>
      {/* English: "3.14" */}
      {/* Arabic:  "٣٫١٤" */}
    </div>
  );
}
```

### All Available Functions

| Function | Purpose | Example Input | English Output | Arabic Output |
|----------|---------|---------------|----------------|---------------|
| `formatNumber(1234)` | Basic number | 1234 | 1,234 | ١٬٢٣٤ |
| `formatCurrency(99.99)` | Currency | 99.99 | $99.99 | ٩٩٫٩٩ ج.م. |
| `formatPercent(0.85)` | Percentage | 0.85 | 85% | ٨٥٪ |
| `formatCompact(1500)` | Compact | 1500 | 1.5K | ١٫٥ ألف |
| `formatInt(42)` | Integer | 42 | 42 | ٤٢ |
| `formatDecimal(3.14159, 2)` | Decimal | 3.14159 | 3.14 | ٣٫١٤ |

### In Utility Files (Non-React)

```typescript
import { getNumberFormatters } from '@/lib/numberConfig';

const { formatNumber, formatCurrency } = getNumberFormatters('ar-SA');

const count = formatNumber(1234);        // "١٬٢٣٤"
const price = formatCurrency(99.99);     // "٩٩٫٩٩ ر.س."
```

---

## Common Use Cases

### 1. Display Count with Label

```typescript
import { useNumber } from '@/lib/numberConfig';
import { useTranslation } from 'react-i18next';

function AgentsList({ agents }) {
  const { formatInt } = useNumber();
  const { t } = useTranslation();

  return (
    <h2>
      {t('agents.total')}: {formatInt(agents.length)}
      {/* English: "Total Agents: 42" */}
      {/* Arabic:  "إجمالي الوكلاء: ٤٢" */}
    </h2>
  );
}
```

### 2. Display Statistics Dashboard

```typescript
import { useNumber } from '@/lib/numberConfig';

function Dashboard({ stats }) {
  const { formatCompact, formatPercent } = useNumber();

  return (
    <div>
      <div>
        <p>Total Users</p>
        <p>{formatCompact(stats.totalUsers)}</p>
        {/* English: "1.2K" */}
        {/* Arabic:  "١٫٢ ألف" */}
      </div>

      <div>
        <p>Success Rate</p>
        <p>{formatPercent(stats.successRate)}</p>
        {/* English: "95%" */}
        {/* Arabic:  "٩٥٪" */}
      </div>
    </div>
  );
}
```

### 3. Display Prices in Tables

```typescript
import { useNumber } from '@/lib/numberConfig';

function PricingTable({ plans }) {
  const { formatCurrency } = useNumber();

  return (
    <table>
      {plans.map(plan => (
        <tr key={plan.id}>
          <td>{plan.name}</td>
          <td>{formatCurrency(plan.price)}</td>
          {/* English: "$99.99" */}
          {/* Arabic:  "٩٩٫٩٩ ج.م." */}
        </tr>
      ))}
    </table>
  );
}
```

### 4. Display Agent/Lead/Conversation IDs

```typescript
import { useNumber } from '@/lib/numberConfig';

function LeadCard({ lead }) {
  const { formatInt } = useNumber();

  return (
    <div>
      <p>Lead #{formatInt(lead.id)}</p>
      {/* English: "Lead #1234" */}
      {/* Arabic:  "عميل #١٢٣٤" */}
    </div>
  );
}
```

---

## When to Use Each Function

### `formatNumber()` - General Purpose
Use for any numeric value that doesn't fit the other categories:
- Counts (users, items, records)
- IDs
- Quantities
- Generic statistics

### `formatInt()` - Whole Numbers
Use when you specifically want no decimal places:
- Record counts
- Item quantities
- Sequential IDs

### `formatDecimal()` - Precise Values
Use when you need specific decimal precision:
- Ratings (4.5 stars)
- Scientific values
- Measurements

### `formatCurrency()` - Money
Use for all monetary values:
- Prices
- Totals
- Balances
- Revenue

### `formatPercent()` - Percentages
Use for ratio/percentage values:
- Success rates
- Progress indicators
- Completion percentages
- Growth rates

### `formatCompact()` - Large Numbers
Use for large numbers in constrained spaces:
- Social media counts (followers, views)
- Large statistics
- Dashboard metrics
- Chart labels

---

## Implementation Details

### How It Works

Both date and number formatting use native JavaScript `Intl` APIs:

```typescript
// For Arabic locales
new Intl.NumberFormat('ar-SA', {
  numberingSystem: 'arab'  // ٠-٩ instead of 0-9
}).format(1234);
// Output: "١٬٢٣٤"

// For Gregorian dates with Arabic numerals
new Intl.DateTimeFormat('ar-SA', {
  calendar: 'gregory',      // Miladi, not Hijri
  numberingSystem: 'arab'   // ٠-٩ instead of 0-9
}).format(new Date());
// Output: "٢٨ ديسمبر ٢٠٢٥"
```

### Browser Support

- ✅ Chrome 52+
- ✅ Firefox 34+
- ✅ Safari 9.1+
- ✅ Edge 79+
- **Coverage**: 98%+ of users

### Performance

- **Native APIs**: Zero external dependencies
- **Browser-optimized**: Faster than string manipulation
- **Cached formatters**: Reuses formatter instances where possible

---

## Migration Guide

### Before (Hardcoded Numbers)

```typescript
// ❌ Don't do this - no localization
<p>Total: {agents.length}</p>
<p>Price: ${price}</p>
<p>Progress: {(progress * 100).toFixed(0)}%</p>
```

### After (Localized Numbers)

```typescript
// ✅ Do this - proper localization
import { useNumber } from '@/lib/numberConfig';

const { formatInt, formatCurrency, formatPercent } = useNumber();

<p>Total: {formatInt(agents.length)}</p>
<p>Price: {formatCurrency(price)}</p>
<p>Progress: {formatPercent(progress)}</p>
```

---

## FAQ

### Q: Do I need to change existing components?

**A**: Dates are automatically handled if you're using `useDateLocale()`. For numbers, you need to gradually migrate to `useNumber()` hook.

### Q: What about user input fields?

**A**: Input fields should accept both Western (0-9) and Arabic-Indic (٠-٩) numerals. The formatters are for display only.

### Q: Can I override the currency?

**A**: Yes! Pass a custom currency code:
```typescript
formatCurrency(99.99, 'USD')  // Force USD instead of SAR/EGP
```

### Q: What about Hijri calendar?

**A**: The current implementation uses Gregorian (Miladi) calendar with Arabic-Indic numerals. Hijri support can be added if needed.

### Q: Performance concerns?

**A**: Native `Intl` APIs are highly optimized and faster than string manipulation. The formatters are also internally cached by the browser.

---

## Testing Checklist

When adding number formatting to a component:

- [ ] Test with English locale (`en`)
- [ ] Test with Arabic Saudi (`ar-SA`)
- [ ] Test with Arabic Egyptian (`ar-EG`)
- [ ] Verify proper RTL alignment in Arabic
- [ ] Check decimal/thousand separators
- [ ] Verify currency symbols are correct
- [ ] Test edge cases (0, negative numbers, very large numbers)

---

## Resources

- [MDN: Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [Unicode CLDR Locale Data](http://cldr.unicode.org/)

---

**Last Updated**: December 28, 2025
**Maintainer**: Mojeeb Development Team
