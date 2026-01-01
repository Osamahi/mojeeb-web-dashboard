/**
 * Mojeeb Minimal Settings Page
 * Placeholder page for application settings
 * Clean minimal design ready for future implementation
 */

import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Card } from '@/components/ui/Card';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export const SettingsPage = () => {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_settings');

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <BaseHeader
        title={t('pages.settings')}
        subtitle={t('pages.settings_subtitle')}
      />

      {/* Language Settings Card */}
      <div className="max-w-2xl">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Language Preferences
          </h3>
          <LanguageSwitcher />
        </Card>
      </div>

      {/* Coming Soon - Additional Settings */}
      <div className="max-w-2xl">
        <Card className="p-6">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
              <Settings className="w-8 h-8 text-neutral-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-950 mb-2">
              {t('pages.settings_coming_soon')}
            </h3>
            <p className="text-neutral-600">
              {t('pages.settings_under_development')}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
