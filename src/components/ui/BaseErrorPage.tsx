import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ArrowLeft, RotateCw } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface BaseErrorPageProps {
  icon: React.ComponentType<LucideProps>;
  titleKey: string;
  descriptionKey: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  showRetryButton?: boolean;
  onRetry?: () => void;
}

export function BaseErrorPage({
  icon: Icon,
  titleKey,
  descriptionKey,
  showBackButton = true,
  showHomeButton = true,
  showRetryButton = false,
  onRetry,
}: BaseErrorPageProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    navigate(-1);
  };

  const handleHome = () => {
    navigate('/conversations');
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        {/* Error Icon - Mojeeb Brand Styling */}
        <div className="flex justify-center">
          <div className="relative">
            <Icon className="w-24 h-24 text-brand-cyan/20" strokeWidth={1.5} />
          </div>
        </div>

        {/* Error Title - Alexandria Font */}
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-neutral-950 rtl:font-arabic">
            {t(titleKey)}
          </h1>

          {/* Error Description */}
          <p className="text-base text-neutral-600 rtl:font-arabic max-w-sm mx-auto">
            {t(descriptionKey)}
          </p>
        </div>

        {/* Action Buttons - Mojeeb Button Style */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="inline-flex items-center justify-center gap-2 h-10 px-6 text-base font-medium bg-white text-neutral-950 border border-neutral-300 rounded-md hover:bg-neutral-50 active:bg-neutral-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:ring-offset-2 rtl:font-arabic"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              {t('error_pages.actions.go_back')}
            </button>
          )}

          {showRetryButton && (
            <button
              onClick={handleRetry}
              className="inline-flex items-center justify-center gap-2 h-10 px-6 text-base font-medium bg-brand-cyan text-white rounded-md hover:bg-brand-cyan/90 active:bg-brand-cyan/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:ring-offset-2 rtl:font-arabic"
            >
              <RotateCw className="w-4 h-4" />
              {t('error_pages.actions.retry')}
            </button>
          )}

          {showHomeButton && (
            <button
              onClick={handleHome}
              className="inline-flex items-center justify-center gap-2 h-10 px-6 text-base font-medium bg-brand-cyan text-white rounded-md hover:bg-brand-cyan/90 active:bg-brand-cyan/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:ring-offset-2 rtl:font-arabic"
            >
              <Home className="w-4 h-4" />
              {t('error_pages.actions.go_home')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
