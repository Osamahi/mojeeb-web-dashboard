/**
 * Country Detection Utilities
 * Detects user's country based on browser timezone and screen size
 */

// Timezone to country code mapping (same as mojeeb-landing)
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Africa/Cairo': 'EG',
  'Asia/Riyadh': 'SA',
  'Asia/Dubai': 'AE',
  'Asia/Kuwait': 'KW',
  'Asia/Qatar': 'QA',
  'Asia/Bahrain': 'BH',
  'Asia/Muscat': 'OM',
  'Asia/Baghdad': 'IQ',
  'Asia/Amman': 'JO',
  'Asia/Beirut': 'LB',
  'Asia/Damascus': 'SY',
  'Asia/Jerusalem': 'IL',
  'Asia/Nicosia': 'CY',
  'Asia/Istanbul': 'TR',
  'Europe/London': 'GB',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Rome': 'IT',
  'Europe/Madrid': 'ES',
  'Europe/Athens': 'GR',
  'Europe/Amsterdam': 'NL',
  'Europe/Brussels': 'BE',
  'Europe/Vienna': 'AT',
  'Europe/Prague': 'CZ',
  'Europe/Warsaw': 'PL',
  'Europe/Budapest': 'HU',
  'Europe/Bucharest': 'RO',
  'Europe/Sofia': 'BG',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Helsinki': 'FI',
  'Europe/Dublin': 'IE',
  'Europe/Lisbon': 'PT',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Mexico_City': 'MX',
  'America/Sao_Paulo': 'BR',
  'America/Buenos_Aires': 'AR',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Shanghai': 'CN',
  'Asia/Hong_Kong': 'HK',
  'Asia/Singapore': 'SG',
  'Asia/Bangkok': 'TH',
  'Asia/Jakarta': 'ID',
  'Asia/Manila': 'PH',
  'Asia/Karachi': 'PK',
  'Asia/Kolkata': 'IN',
  'Pacific/Auckland': 'NZ',
};

/**
 * Detect user's country from browser timezone
 * Defaults to 'SA' (Saudi Arabia) if not found
 */
export function detectCountryFromTimezone(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_TO_COUNTRY[timezone] || 'SA';
  } catch {
    return 'SA';
  }
}

/**
 * Get browser metadata for API submission
 */
export function getBrowserMetadata() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const platform = navigator.platform;
  const language = navigator.language;
  const country = detectCountryFromTimezone();

  // Detect device type from screen width
  let deviceType: 'mobile' | 'tablet' | 'desktop';
  if (window.screen.width < 768) {
    deviceType = 'mobile';
  } else if (window.screen.width < 1024) {
    deviceType = 'tablet';
  } else {
    deviceType = 'desktop';
  }

  return {
    timezone,
    screenResolution,
    platform,
    language,
    deviceType,
    country,
  };
}
