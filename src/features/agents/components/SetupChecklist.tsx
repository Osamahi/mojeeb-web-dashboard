/**
 * Setup Checklist Component
 * Horizontal stepper: dots + connectors on one line, labels below.
 * 4 steps: Create → Knowledge → Test → Connect
 * When all done, shows Subscribe CTA.
 * All steps are dynamic (server data).
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SetupChecklistProps {
  hasKnowledge: boolean;
  hasTested: boolean;
  hasConnections: boolean;
  onAddKnowledge: () => void;
  onTestAgent: () => void;
  onConnect: () => void;
  onSubscribe: () => void;
}

type Status = 'done' | 'active' | 'locked';

function SetupChecklistInner({
  hasKnowledge,
  hasTested,
  hasConnections,
  onAddKnowledge,
  onTestAgent,
  onConnect,
  onSubscribe,
}: SetupChecklistProps) {
  const { t } = useTranslation();

  const step1: Status = 'done';
  const step2: Status = hasKnowledge ? 'done' : 'active';
  const step3: Status = hasTested ? 'done' : hasKnowledge ? 'active' : 'locked';
  const step4: Status = hasConnections ? 'done' : hasTested ? 'active' : 'locked';

  const allDone = hasKnowledge && hasTested && hasConnections;

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

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: '#FCFEFC',
        boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Top accent line */}
      <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #7DFF51, #00DBB7)' }} />

      <div className="px-6 pt-5 pb-4">
        {/* Stepper */}
        <div className="flex items-start">
          <Step status={step1} label={t('setup_checklist.step_create')} />
          <Line filled={step1 === 'done'} />
          <Step status={step2} label={t('setup_checklist.step_knowledge')} />
          <Line filled={step2 === 'done'} />
          <Step status={step3} label={t('setup_checklist.step_test')} />
          <Line filled={step3 === 'done'} />
          <Step status={step4} label={t('setup_checklist.step_connect')} />
        </div>

        {/* Hint + CTA */}
        {allDone ? (
          <>
            <p className="text-xs text-[#808178] mt-4 text-center">
              {t('setup_checklist.hint_subscribe')}
            </p>
            <button
              onClick={onSubscribe}
              className={cn(
                'w-full mt-3 py-2.5 rounded-lg',
                'bg-[#272726] text-[#FCFEFC] text-sm font-medium',
                'hover:bg-[#0A0A17] active:scale-[0.98]',
                'transition-all duration-150',
                'flex items-center justify-center gap-2',
              )}
            >
              {t('setup_checklist.step_subscribe_action')}
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </>
        ) : (
          <>
            {activeHint && (
              <p className="text-xs text-[#808178] mt-4 text-center">{activeHint}</p>
            )}
            {activeAction && (
              <button
                onClick={activeAction.fn}
                className={cn(
                  'w-full mt-3 py-2.5 rounded-lg',
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
          </>
        )}
      </div>
    </motion.div>
  );
}

export const SetupChecklist = memo(SetupChecklistInner);

// ─── Step ────────────────────────────────────────────────────

function Step({ status, label }: { status: Status; label: string }) {
  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      {status === 'done' ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="w-6 h-6 rounded-full bg-brand-mojeeb flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </motion.div>
      ) : status === 'active' ? (
        <div className="w-6 h-6 rounded-full border-2 border-[#272726]" />
      ) : (
        <div className="w-6 h-6 rounded-full bg-[#D8D8D0]/50" />
      )}
      <span className={cn(
        'text-[11px] mt-1.5 text-center whitespace-nowrap',
        status === 'done' && 'text-[#808178]',
        status === 'active' && 'text-[#272726] font-medium',
        status === 'locked' && 'text-[#D8D8D0]',
      )}>
        {label}
      </span>
    </div>
  );
}

// ─── Connector ───────────────────────────────────────────────

function Line({ filled }: { filled: boolean }) {
  return (
    <div className={cn(
      'h-px flex-1 mt-3',
      filled ? 'bg-brand-mojeeb' : 'bg-[#D8D8D0]',
    )} />
  );
}
