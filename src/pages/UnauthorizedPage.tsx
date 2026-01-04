import React from 'react';
import { ShieldX } from 'lucide-react';
import { BaseErrorPage } from '@/components/ui/BaseErrorPage';

export function UnauthorizedPage() {
  return (
    <BaseErrorPage
      icon={ShieldX}
      titleKey="error_pages.unauthorized.title"
      descriptionKey="error_pages.unauthorized.description"
      showBackButton={true}
      showHomeButton={true}
      showRetryButton={false}
    />
  );
}
