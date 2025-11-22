/**
 * Step 3: Add Knowledge (Optional/Skippable)
 * Optional step to add initial knowledge base content
 */

import { useState } from 'react';
import { useOnboardingStore } from '../stores/onboardingStore';

interface StepKnowledgeProps {
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export const StepKnowledge = ({ onNext, onSkip, onBack }: StepKnowledgeProps) => {
  const { data, setKnowledgeContent } = useOnboardingStore();
  const [content, setContent] = useState(data.knowledgeContent);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setKnowledgeContent(newContent);
  };

  const handleSubmit = () => {
    setKnowledgeContent(content);
    onNext();
  };

  return (
    <div className="w-full">
      {/* Mobile-first heading - left-aligned */}
      <h1 className="text-3xl sm:text-4xl font-bold text-neutral-950 mb-2 tracking-tight">
        Add Knowledge
      </h1>
      <p className="text-sm sm:text-base text-neutral-600 mb-6">
        Provide information your agent needs to answer customers
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-20">
          <textarea
            id="knowledge"
            value={content}
            onChange={handleContentChange}
            rows={8}
            placeholder="FAQs, product info, opening hours, price...etc"
            className="w-full px-4 py-3 text-sm font-mono border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors resize-none"
          />
        </div>
      </form>
    </div>
  );
};
