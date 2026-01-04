import React from 'react';
import { WifiOff } from 'lucide-react';
import { BaseErrorPage } from '@/components/ui/BaseErrorPage';

export function NetworkErrorPage() {
  return (
    <BaseErrorPage
      icon={WifiOff}
      titleKey="error_pages.network_error.title"
      descriptionKey="error_pages.network_error.description"
      showBackButton={false}
      showHomeButton={false}
      showRetryButton={true}
    />
  );
}
