import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { useCreateConnection, useInitiateGoogleOAuth } from '../hooks/useIntegrations';
import { FileSpreadsheet, CheckCircle2, X, Loader2 } from 'lucide-react';
import { openOAuthPopup, getOAuthErrorMessage, cleanupOAuthStorage } from '@/features/connections/utils/oauthManager';
import { toast } from 'sonner';

interface CreateConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Extract spreadsheet ID from a Google Sheets URL or return the raw ID if already an ID.
 * Supports: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
 */
function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  // Try to extract from URL
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // Already a raw ID
  return trimmed;
}

export default function CreateConnectionModal({ isOpen, onClose }: CreateConnectionModalProps) {
  const { t } = useTranslation();
  const createMutation = useCreateConnection();
  const initiateOAuth = useInitiateGoogleOAuth();

  const connectorType = 'google_sheets' as const;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [spreadsheetInput, setSpreadsheetInput] = useState('');
  const [defaultTab, setDefaultTab] = useState('');
  const [tempConnectionId, setTempConnectionId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const spreadsheetId = extractSpreadsheetId(spreadsheetInput);

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setSpreadsheetInput('');
    setDefaultTab('');
    setTempConnectionId(null);
    setIsConnecting(false);
    cleanupOAuthStorage();
  }, []);

  const handleClose = useCallback(() => {
    if (!createMutation.isPending && !isConnecting) {
      resetForm();
      onClose();
    }
  }, [createMutation.isPending, isConnecting, resetForm, onClose]);

  const handleConnectGoogle = useCallback(async () => {
    setIsConnecting(true);
    try {
      const authUrl = await initiateOAuth.mutateAsync();
      const result = await openOAuthPopup(authUrl);
      setTempConnectionId(result.tempConnectionId);
      toast.success(t('integrations.google_connected'));
    } catch (error) {
      const message = getOAuthErrorMessage(error);
      toast.error(message);
    } finally {
      setIsConnecting(false);
    }
  }, [initiateOAuth, t]);

  const clearConnection = useCallback(() => {
    setTempConnectionId(null);
    cleanupOAuthStorage();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !spreadsheetId.trim() || !tempConnectionId) return;

    try {
      await createMutation.mutateAsync({
        connectorType,
        name: name.trim(),
        description: description.trim() || undefined,
        config: {
          spreadsheet_id: spreadsheetId,
          default_tab: defaultTab.trim() || undefined,
        },
        tempConnectionId,
      });
      resetForm();
      onClose();
    } catch {
      // Error handled in hook
    }
  }, [connectorType, name, description, spreadsheetId, defaultTab, tempConnectionId, createMutation, resetForm, onClose]);

  const isValid = name.trim() && spreadsheetId && tempConnectionId;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('integrations.create_connection')}
      subtitle={t('integrations.create_connection_subtitle')}
      maxWidth="lg"
      isLoading={createMutation.isPending}
      closable={!createMutation.isPending && !isConnecting}
    >
      <div className="space-y-5">
        {/* Connector Type - visual selector */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('integrations.connector_type')}
          </label>
          <div className="flex items-center gap-3 rounded-xl border-2 border-primary-200 bg-primary-50/50 px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900">Google Sheets</p>
              <p className="text-xs text-neutral-500">{t('integrations.google_sheets_desc')}</p>
            </div>
          </div>
        </div>

        {/* Google Account Connection */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('integrations.google_account')} <span className="text-red-500">*</span>
          </label>

          {!tempConnectionId ? (
            <button
              onClick={handleConnectGoogle}
              disabled={isConnecting || createMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-4 py-4 text-sm font-medium text-neutral-700 transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
                  {t('integrations.connecting')}
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t('integrations.connect_with_google')}
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-green-800">{t('integrations.google_connected')}</p>
                <p className="text-xs text-green-600">{t('integrations.google_connected_hint')}</p>
              </div>
              <button
                onClick={clearConnection}
                disabled={createMutation.isPending}
                className="shrink-0 rounded-md p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Connection Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('integrations.connection_name')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('integrations.connection_name_placeholder')}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            disabled={createMutation.isPending}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('integrations.description')}
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('integrations.description_placeholder')}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            disabled={createMutation.isPending}
          />
        </div>

        {/* Spreadsheet URL or ID */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('integrations.spreadsheet_url')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={spreadsheetInput}
            onChange={(e) => setSpreadsheetInput(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/1h-JyCW.../edit"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            disabled={createMutation.isPending}
          />
          {spreadsheetInput && spreadsheetId && spreadsheetId !== spreadsheetInput && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              {t('integrations.spreadsheet_id_extracted')}: <span className="font-mono">{spreadsheetId.slice(0, 20)}...</span>
            </p>
          )}
          <p className="mt-1 text-xs text-neutral-400">
            {t('integrations.spreadsheet_url_hint')}
          </p>
        </div>

        {/* Default Tab */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('integrations.default_tab')}
          </label>
          <input
            type="text"
            value={defaultTab}
            onChange={(e) => setDefaultTab(e.target.value)}
            placeholder={t('integrations.default_tab_placeholder')}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            disabled={createMutation.isPending}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2 border-t border-neutral-100">
          <button
            onClick={handleClose}
            disabled={createMutation.isPending}
            className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || createMutation.isPending}
            className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? t('common.saving') : t('integrations.create_connection')}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
