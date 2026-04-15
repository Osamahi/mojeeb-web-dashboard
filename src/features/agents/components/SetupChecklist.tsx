/**
 * Setup Checklist Component
 * Horizontal stepper: dots + connectors on one line, labels below.
 * 4 steps: Create → Knowledge → Test → Connect
 * When all done, shows Subscribe CTA.
 * All steps are dynamic (server data).
 *
 * Loading UX: skeleton shell, then smooth sequential reveal
 * once all data arrives. Direction-aware (RTL reverses sequence).
 */

import { Fragment, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Check, ArrowRight, MessagesSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsDesktop } from '@/hooks/useMediaQuery';

interface SetupChecklistProps {
  isLoading?: boolean;
  hasKnowledge: boolean;
  hasTested: boolean;
  hasConnections: boolean;
  onAddKnowledge: () => void;
  onTestAgent: () => void;
  onConnect: () => void;
  onSubscribe: () => void;
}

type Status = 'done' | 'active' | 'locked';

/** Base stagger delay between each visual element (seconds) */
const STAGGER = 0.12;

function SetupChecklistInner({
  isLoading,
  hasKnowledge,
  hasTested,
  hasConnections,
  onAddKnowledge,
  onTestAgent,
  onConnect,
  onSubscribe,
}: SetupChecklistProps) {
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();

  // ─── Skeleton while queries are in flight ───────────────────
  if (isLoading) {
    return (
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: '#FCFEFC',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="h-[2px] bg-[#D8D8D0]/50" />
        <div className="px-6 py-7 animate-pulse">
          <div className="flex items-start">
            {[0, 1, 2, 3].map((i) => (
              <Fragment key={i}>
                {i > 0 && <div className="h-px flex-1 mt-3 bg-[#D8D8D0]/40" />}
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-[#D8D8D0]/40" />
                  <div className="w-12 h-2.5 rounded bg-[#D8D8D0]/40 mt-2" />
                </div>
              </Fragment>
            ))}
          </div>
          <div className="w-48 h-3 rounded bg-[#D8D8D0]/40 mt-4 mx-auto" />
          <div className="w-full h-10 rounded-lg bg-[#D8D8D0]/30 mt-3" />
        </div>
      </div>
    );
  }

  // ─── Resolve step statuses ──────────────────────────────────
  const step1: Status = 'done';
  const step2: Status = hasKnowledge ? 'done' : 'active';
  const step3: Status = hasTested ? 'done' : hasKnowledge ? 'active' : 'locked';
  const step4: Status = hasConnections ? 'done' : hasTested ? 'active' : 'locked';
  const statuses: Status[] = [step1, step2, step3, step4];

  const allDone = hasKnowledge && hasTested && hasConnections;
  const showTestAgain = hasTested && !isDesktop;

  // Determine active action + hint
  let activeAction: { label: string; fn: () => void } | null = null;
  let activeHint: string | null = null;

  if (!hasKnowledge) {
    activeAction = { label: t('setup_checklist.step_knowledge_action'), fn: onAddKnowledge };
    activeHint = t('setup_checklist.hint_knowledge');
  } else if (!hasTested) {
    activeAction = { label: t('setup_checklist.step_test_action'), fn: onTestAgent };
    activeHint = t('setup_checklist.hint_test');
  } else if (!hasConnections) {
    activeAction = { label: t('setup_checklist.step_connect_action'), fn: onConnect };
    activeHint = t('setup_checklist.hint_connect');
  }

  const labels = [
    t('setup_checklist.step_create'),
    t('setup_checklist.step_knowledge'),
    t('setup_checklist.step_test'),
    t('setup_checklist.step_connect'),
  ];

  // Build sequential visual indices: step0, line0, step1, line1, step2, line2, step3
  // DOM order is always Create→Connect. In RTL, the browser's flex-direction
  // already renders them right-to-left, so DOM-order stagger = visual RTL.
  // We keep the same DOM-order stagger in both directions.
  const totalVisualSlots = 7; // 4 steps + 3 lines

  // The CTA area appears after the last stepper element
  const ctaDelay = (totalVisualSlots + 1) * STAGGER;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: '#FCFEFC',
        boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Top accent line — sweeps in the reading direction */}
      <motion.div
        className="h-[2px] origin-left rtl:origin-right"
        style={{ background: 'linear-gradient(90deg, #7DFF51, #00DBB7)' }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />

      <div className="px-6 py-7">
        {/* Stepper row */}
        <div className="flex items-start">
          {statuses.map((status, i) => {
            // visual slot: step i occupies slot i*2, line before it occupies slot i*2-1
            const stepSlot = i * 2;
            const lineSlot = i * 2 - 1;

            return (
              <Fragment key={i}>
                {i > 0 && (
                  <AnimatedLine
                    filled={statuses[i - 1] === 'done'}
                    delay={lineSlot * STAGGER}
                  />
                )}
                <AnimatedStep
                  status={status}
                  label={labels[i]}
                  delay={stepSlot * STAGGER}
                />
              </Fragment>
            );
          })}
        </div>

        {/* Hint + CTA — fades in after stepper completes */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ctaDelay, duration: 0.3, ease: 'easeOut' }}
        >
          {allDone ? (
            <>
              <div className="flex gap-2 mt-4">
                {showTestAgain && (
                  <button
                    onClick={onTestAgent}
                    className={cn(
                      'py-2.5 px-3 rounded-lg',
                      'border border-[#D8D8D0] text-[#808178] text-sm font-medium',
                      'hover:border-[#272726] hover:text-[#272726] active:scale-[0.98]',
                      'transition-all duration-150',
                      'flex items-center justify-center gap-1.5',
                    )}
                  >
                    <MessagesSquare className="w-3.5 h-3.5" />
                    {t('setup_checklist.test_again')}
                  </button>
                )}
                <button
                  onClick={onSubscribe}
                  className={cn(
                    'flex-1 py-2.5 rounded-lg',
                    'bg-[#272726] text-[#FCFEFC] text-sm font-medium',
                    'hover:bg-[#0A0A17] active:scale-[0.98]',
                    'transition-all duration-150',
                    'flex items-center justify-center gap-2',
                  )}
                >
                  {t('setup_checklist.step_subscribe_action')}
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>
              <p className="text-xs text-[#808178] mt-3 text-center">
                {t('setup_checklist.hint_subscribe')}
              </p>
            </>
          ) : (
            <>
              <div className="flex gap-2 mt-4">
                {showTestAgain && activeAction && (
                  <button
                    onClick={onTestAgent}
                    className={cn(
                      'py-2.5 px-3 rounded-lg',
                      'border border-[#D8D8D0] text-[#808178] text-sm font-medium',
                      'hover:border-[#272726] hover:text-[#272726] active:scale-[0.98]',
                      'transition-all duration-150',
                      'flex items-center justify-center gap-1.5',
                    )}
                  >
                    <MessagesSquare className="w-3.5 h-3.5" />
                    {t('setup_checklist.test_again')}
                  </button>
                )}
                {activeAction && (
                  <button
                    onClick={activeAction.fn}
                    className={cn(
                      'flex-1 py-2.5 rounded-lg',
                      'bg-[#272726] text-[#FCFEFC] text-sm font-medium',
                      'hover:bg-[#0A0A17] active:scale-[0.98]',
                      'transition-all duration-150',
                      'flex items-center justify-center gap-2',
                    )}
                  >
                    {activeAction.label}
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                )}
              </div>
              {activeHint && (
                <p className="text-xs text-[#808178] mt-3 text-center">{activeHint}</p>
              )}
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

export const SetupChecklist = memo(SetupChecklistInner);

// ─── Animated Step ──────────────────────────────────────────────

function AnimatedStep({
  status,
  label,
  delay,
}: {
  status: Status;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      className="flex flex-col items-center flex-1 min-w-0"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {status === 'done' ? (
        <motion.div
          className="w-6 h-6 rounded-full bg-brand-mojeeb flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: delay + 0.05,
            type: 'spring',
            stiffness: 400,
            damping: 15,
          }}
        >
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </motion.div>
      ) : status === 'active' ? (
        <div className="w-6 h-6 rounded-full border-2 border-[#272726]" />
      ) : (
        <div className="w-6 h-6 rounded-full bg-[#D8D8D0]/50" />
      )}
      <span
        className={cn(
          'text-[11px] mt-1.5 text-center whitespace-nowrap',
          status === 'done' && 'text-[#808178]',
          status === 'active' && 'text-[#272726] font-medium',
          status === 'locked' && 'text-[#D8D8D0]',
        )}
      >
        {label}
      </span>
    </motion.div>
  );
}

// ─── Animated Connector ─────────────────────────────────────────

function AnimatedLine({
  filled,
  delay,
}: {
  filled: boolean;
  delay: number;
}) {
  return (
    <div className="flex-1 mt-3 h-px relative">
      {/* Background track */}
      <div className="absolute inset-0 bg-[#D8D8D0]" />
      {/* Filled overlay — grows from inline-start (respects RTL via logical property) */}
      {filled && (
        <motion.div
          className="absolute inset-0 bg-brand-mojeeb origin-left rtl:origin-right"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay, duration: 0.3, ease: 'easeOut' }}
        />
      )}
    </div>
  );
}
