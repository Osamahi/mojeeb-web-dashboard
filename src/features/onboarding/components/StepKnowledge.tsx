/**
 * Step 3: Add Knowledge (Optional/Skippable)
 * Optional step to add initial knowledge base content
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useOnboardingStore } from '../stores/onboardingStore';

interface StepKnowledgeProps {
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

const SAMPLE_FAQ = `Q: What are your business hours?
A: We're open Monday to Friday, 9 AM to 6 PM EST.

Q: How can I contact support?
A: You can reach us via email at support@company.com or through this chat.

Q: What is your refund policy?
A: We offer a 30-day money-back guarantee on all purchases.`;

export const StepKnowledge = ({ onNext, onSkip, onBack }: StepKnowledgeProps) => {
  const { data, setKnowledgeContent } = useOnboardingStore();
  const [content, setContent] = useState(data.knowledgeContent);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setKnowledgeContent(newContent);
  };

  const handleLoadSample = () => {
    setContent(SAMPLE_FAQ);
    setKnowledgeContent(SAMPLE_FAQ);
  };

  const handleSubmit = () => {
    setKnowledgeContent(content);
    onNext();
  };

  const hasContent = content.trim().length > 0;

  return (
    <div className="w-full">
      {/* Mobile-first heading - left-aligned */}
      <h1 className="text-3xl sm:text-4xl font-bold text-neutral-950 mb-2 tracking-tight">
        Add Knowledge (Optional)
      </h1>
      <p className="text-sm sm:text-base text-neutral-600 mb-6">
        Help your agent answer questions accurately
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Textarea */}
          <div>
            <label htmlFor="knowledge" className="block text-sm font-medium text-neutral-900 mb-2">
              FAQs, product info, or company details
            </label>
            <textarea
              id="knowledge"
              value={content}
              onChange={handleContentChange}
              rows={8}
              placeholder="Paste your content here..."
              className="w-full px-4 py-3 text-sm font-mono border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors resize-none"
            />
            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-xs text-neutral-600 hover:text-neutral-900 underline"
              >
                Load sample FAQ
              </button>
              <span className="text-xs text-neutral-500">
                {content.length} characters
              </span>
            </div>
          </div>

          {/* Info tip - compact */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <p className="text-xs text-blue-900">
              💡 You can always add more knowledge later in settings
            </p>
          </div>
        </div>
      </form>

      {/* Back button */}
      <button
        onClick={onBack}
        className="mt-8 text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back
      </button>
    </div>
  );
};
