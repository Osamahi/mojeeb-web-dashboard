import React from 'react';
import { ServerCrash } from 'lucide-react';
import { BaseErrorPage } from '@/components/ui/BaseErrorPage';

export function ServerErrorPage() {
  return (
    <BaseErrorPage
      icon={ServerCrash}
      titleKey="error_pages.server_error.title"
      descriptionKey="error_pages.server_error.description"
      showBackButton={false}
      showHomeButton={true}
      showRetryButton={true}
    />
  );
}
