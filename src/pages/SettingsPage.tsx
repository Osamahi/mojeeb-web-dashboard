/**
 * Mojeeb Minimal Settings Page
 * Placeholder page for application settings
 * Clean minimal design ready for future implementation
 */

import { Settings } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';

export const SettingsPage = () => {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <BaseHeader
        title="Settings"
        subtitle="Manage your account and application preferences"
      />

      {/* Coming Soon - Minimal Empty State */}
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
            <Settings className="w-8 h-8 text-neutral-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-950 mb-2">
            Settings Coming Soon
          </h2>
          <p className="text-neutral-600">
            This feature is under development. You'll be able to configure all settings here.
          </p>
        </div>
      </div>
    </div>
  );
};
