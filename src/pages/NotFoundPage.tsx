import React from 'react';
import { FileQuestion } from 'lucide-react';
import { BaseErrorPage } from '@/components/ui/BaseErrorPage';

export function NotFoundPage() {
  return (
    <BaseErrorPage
      icon={FileQuestion}
      titleKey="error_pages.not_found.title"
      descriptionKey="error_pages.not_found.description"
      showBackButton={true}
      showHomeButton={true}
      showRetryButton={false}
    />
  );
}
