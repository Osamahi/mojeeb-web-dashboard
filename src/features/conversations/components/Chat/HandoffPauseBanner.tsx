/**
 * HandoffPauseBanner
 *
 * Shown above the message composer when a conversation is in an AI hands-off pause
 * (`ai_handoff_until > NOW()`). Displays a live countdown to auto-resume and a
 * "Resume AI now" button that immediately clears the pause.
 *
 * - Auto-hides itself when the countdown reaches zero (no realtime push needed).
 * - Same BotOff icon family as the rest of the dashboard's "AI silent" UI.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BotOff } from 'lucide-react';
import { useResumeAi } from '../../hooks/useResumeAi';

interface Props {
  conversationId: string;
  /** ISO 8601 timestamp string. */
  aiHandoffUntil: string;
}

export function HandoffPauseBanner({ conversationId, aiHandoffUntil }: Props) {
  const { t } = useTranslation();
  const resumeMutation = useResumeAi();

  // Drives the countdown re-render every second.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const expiry = new Date(aiHandoffUntil).getTime();
  const remainingMs = Math.max(0, expiry - now);

  // Don't render once the window has elapsed — the backend gate will let the AI
  // re-engage on the next customer message even before the realtime broadcast clears
  // the value, so hiding the banner promptly avoids a stale-state UI moment.
  if (remainingMs <= 0) {
    return null;
  }

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const handleResume = () => {
    if (resumeMutation.isPending) return;
    resumeMutation.mutate({ conversationId });
  };

  return (
    <div className="mt-1 flex items-center justify-between gap-2 rounded-md bg-neutral-50 px-3 py-1.5 text-[11px]">
      <div className="flex items-center gap-1.5 text-neutral-600">
        <BotOff className="w-3 h-3" />
        <span>
          {t('handoff.paused_resumes_in', 'AI paused — resumes in')}{' '}
          <span className="font-mono tabular-nums text-neutral-800">{formatted}</span>
        </span>
      </div>
      <button
        type="button"
        onClick={handleResume}
        disabled={resumeMutation.isPending}
        className="rounded px-2 py-0.5 text-[11px] text-brand-mojeeb hover:bg-neutral-200 disabled:opacity-50 transition-colors"
      >
        {resumeMutation.isPending
          ? t('handoff.resuming', 'Resuming…')
          : t('handoff.resume_ai_now', 'Resume AI now')}
      </button>
    </div>
  );
}
