/**
 * WhatsApp Session Banner
 * - Expired window: replaces the composer with a "Send Template" CTA
 * - Active window: subtle green indicator above the composer
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, AlertTriangle, LayoutTemplate, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '../../types/conversation.types';

const WHATSAPP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check if the 24-hour WhatsApp messaging window has expired.
 * Exported so ChatPanel can use it to hide the composer.
 */
export function getWhatsAppWindowStatus(messages: ChatMessage[]) {
  // Find the most recent customer message
  let lastCustomerTime: Date | null = null;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.sender_role === 1 || msg.sender_role === 'customer') {
      lastCustomerTime = new Date(msg.created_at);
      break;
    }
  }

  if (!lastCustomerTime) {
    return { expired: true, remaining: 0 };
  }

  const elapsed = Date.now() - lastCustomerTime.getTime();
  const remaining = WHATSAPP_WINDOW_MS - elapsed;

  return {
    expired: remaining <= 0,
    remaining: Math.max(0, remaining),
  };
}

function formatTimeRemaining(ms: number, lang: string): string {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const isAr = lang.startsWith('ar');
  const fmt = (n: number) => isAr ? n.toLocaleString('ar-EG') : String(n);
  if (isAr) {
    if (hours > 0) {
      return `${fmt(hours)} ساعات و${fmt(minutes)} دقيقة`;
    }
    return `${fmt(minutes)} دقيقة`;
  }
  if (hours > 0) {
    return `${fmt(hours)}h ${fmt(minutes)}m`;
  }
  return `${fmt(minutes)}m`;
}

// ── Expired Banner (replaces composer) ──────────────────────────

interface ExpiredBannerProps {
  onSendTemplate: () => void;
}

export function WhatsAppExpiredBanner({ onSendTemplate }: ExpiredBannerProps) {
  const { t } = useTranslation();

  return (
    <div
      className="flex-shrink-0 px-3 sm:px-4"
      style={{
        paddingTop: '12px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800 flex-1 text-start">
          {t('whatsapp.session_expired')}
        </p>
        <button
          onClick={onSendTemplate}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
            'bg-amber-600 text-white hover:bg-amber-700 transition-colors',
            'flex-shrink-0'
          )}
        >
          <LayoutTemplate className="w-4 h-4" />
          {t('whatsapp.send_template_btn')}
        </button>
      </div>
    </div>
  );
}

// ── Active Banner (above composer) ──────────────────────────────

interface ActiveBannerProps {
  remainingMs: number;
}

export function WhatsAppActiveBanner({ remainingMs }: ActiveBannerProps) {
  const { t, i18n } = useTranslation();
  const [showInfo, setShowInfo] = useState(false);
  const lang = i18n.language;

  return (
    <>
      <button
        onClick={() => setShowInfo(true)}
        className="flex items-center justify-center gap-1.5 mt-1 w-full transition-colors"
      >
        <Clock className="w-3 h-3 text-brand-mojeeb" />
        <span className="text-[11px] text-brand-mojeeb">
          {t('whatsapp.session_active', {
            time: formatTimeRemaining(remainingMs, lang),
          })}
        </span>
      </button>

      {/* Info Modal */}
      {showInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowInfo(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-[380px] w-full mx-6 px-6 py-7 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close X */}
            <button
              onClick={() => setShowInfo(false)}
              className="absolute top-4 end-4 p-1 hover:bg-neutral-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <Clock className="w-5 h-5 text-brand-mojeeb" />
              <h3 className="text-base font-semibold text-neutral-900">
                {t('whatsapp.info_title', 'WhatsApp 24-Hour Window')}
              </h3>
            </div>

            <div className="space-y-4 text-sm text-neutral-600 leading-relaxed mb-6">
              <p>{t('whatsapp.info_p1', 'WhatsApp requires that businesses respond to customers within 24 hours of their last message.')}</p>
              <p>{t('whatsapp.info_p2', 'While the window is open, you can send any message freely — text, images, audio, or documents.')}</p>
              <p>{t('whatsapp.info_p3', 'Once the 24-hour window expires, you can only reach the customer using a pre-approved template message.')}</p>
            </div>

            <div className="bg-neutral-50 rounded-lg px-4 py-2.5 text-xs text-neutral-500">
              {t('whatsapp.info_remaining', 'Time remaining: {{time}}', {
                time: formatTimeRemaining(remainingMs, lang),
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
