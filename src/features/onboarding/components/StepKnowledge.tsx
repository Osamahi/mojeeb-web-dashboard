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
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-neutral-900 mb-3">
          Teach Your Agent
        </h2>
        <p className="text-neutral-600 text-base">
          Add knowledge to help your agent provide accurate responses
        </p>
        <p className="text-sm text-neutral-500 mt-2">
          Optional - You can add more knowledge later
        </p>
      </div>

      {/* Social Proof */}
      <div className="text-center mb-6">
        <p className="text-sm text-neutral-500">
          Average setup time: 90 seconds
        </p>
      </div>

      {/* Knowledge Input */}
      <div className="space-y-4 mb-8">
        <Textarea
          placeholder="Paste your FAQs, product information, or any knowledge you want your agent to reference..."
          value={content}
          onChange={handleContentChange}
          rows={12}
          className="font-mono text-sm resize-none"
        />

        {/* Helper Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleLoadSample}
            className="text-sm text-neutral-600 hover:text-black transition-colors underline"
          >
            Load sample FAQ
          </button>
          <p className="text-xs text-neutral-500">
            {content.length} characters
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              You can add more later
            </h4>
            <p className="text-sm text-blue-800">
              This is just a quick start. You can upload documents, add more
              content, and manage your knowledge base from the Studio page after
              setup.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 h-12 text-base"
        >
          ← Back
        </Button>

        {hasContent ? (
          <Button
            onClick={handleSubmit}
            className="flex-1 h-12 text-base"
          >
            Add Knowledge →
          </Button>
        ) : (
          <Button
            onClick={onSkip}
            variant="outline"
            className="flex-1 h-12 text-base"
          >
            Skip for Now →
          </Button>
        )}
      </div>
    </div>
  );
};
