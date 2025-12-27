/**
 * Step 3: Add Knowledge (Optional/Skippable)
 * Optional step to add initial knowledge base content
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '../stores/onboardingStore';
import { StepHeading, StepSubtitle } from './shared/StepHeading';

interface StepKnowledgeProps {
  onNext: () => void;
}

export const StepKnowledge = ({ onNext }: StepKnowledgeProps) => {
  const { t } = useTranslation();
  const { data, setKnowledgeContent } = useOnboardingStore();
  const [content, setContent] = useState(data.knowledgeContent);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setKnowledgeContent(newContent);
  };

  return (
    <div className="w-full">
      <StepHeading>{t('onboarding.step_knowledge_title')}</StepHeading>
      <StepSubtitle>{t('onboarding.step_knowledge_subtitle')}</StepSubtitle>

      <div className="mb-20">
        <textarea
          id="knowledge"
          value={content}
          onChange={handleContentChange}
          rows={8}
          placeholder={t('onboarding.step_knowledge_placeholder')}
          className="w-full px-4 py-3 text-sm font-mono border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors resize-none"
        />
      </div>
    </div>
  );
};
