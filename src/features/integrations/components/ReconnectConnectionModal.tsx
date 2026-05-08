import { useState, useCallback } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { useReconnectConnection } from '../hooks/useIntegrations';
import { exchangeAuthCode, getOAuthSessionAccessToken } from '../services/googleOAuthApi';
import { openSpreadsheetPicker, type PickedSpreadsheet } from '../utils/googlePicker';
import { requestGoogleAuthCode } from '../utils/googleAuth';
import { FileSpreadsheet, CheckCircle2, X, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { IntegrationConnection } from '../types';

const GOOGLE_DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

interface ReconnectConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: IntegrationConnection;
}

/**
 * Reconnect modal — refresh OAuth tokens for an existing connection by re-running the GIS code
 * flow + Picker. The user MUST pick the same spreadsheet that the connection was originally bound
 * to; picking a different sheet is rejected so column mappings on dependent actions stay valid.
 */
export default function ReconnectConnectionModal({ isOpen, onClose, connection }: ReconnectConnectionModalProps) {
  const reconnectMutation = useReconnectConnection();

  const [oauthSessionId, setOauthSessionId] = useState<string | null>(null);
  const [pickedSheet, setPickedSheet] = useState<PickedSpreadsheet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const developerKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
  const appId = import.meta.env.VITE_GOOGLE_PROJECT_NUMBER as string | undefined;
  const integrationsClientId = import.meta.env.VITE_GOOGLE_INTEGRATIONS_CLIENT_ID as string | undefined;
  const expectedSheetId = connection.config?.spreadsheet_id as string | undefined;

  const resetForm = useCallback(() => {
    setOauthSessionId(null);
    setPickedSheet(null);
    setIsConnecting(false);
    setIsPicking(false);
    setPickerError(null);
  }, []);

  const handleClose = useCallback(() => {
    if (!reconnectMutation.isPending && !isConnecting && !isPicking) {
      resetForm();
      onClose();
    }
  }, [reconnectMutation.isPending, isConnecting, isPicking, resetForm, onClose]);

  const handleConnectGoogle = useCallback(async () => {
    if (!integrationsClientId) {
      toast.error('Google integrations client ID is not configured (VITE_GOOGLE_INTEGRATIONS_CLIENT_ID)');
      return;
    }
    setIsConnecting(true);
    setPickerError(null);
    try {
      const code = await requestGoogleAuthCode({
        clientId: integrationsClientId,
        scope: GOOGLE_DRIVE_FILE_SCOPE,
      });
      const newSessionId = await exchangeAuthCode(code);
      setOauthSessionId(newSessionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect Google account';
      toast.error(message);
    } finally {
      setIsConnecting(false);
    }
  }, [integrationsClientId]);

  const handlePickSheet = useCallback(async () => {
    if (!oauthSessionId) return;
    if (!developerKey) {
      toast.error('Google API key is not configured (VITE_GOOGLE_API_KEY)');
      return;
    }
    setIsPicking(true);
    setPickerError(null);
    try {
      const oauthToken = await getOAuthSessionAccessToken(oauthSessionId);
      const result = await openSpreadsheetPicker({ oauthToken, developerKey, appId });
      if (result) {
        if (expectedSheetId && result.id !== expectedSheetId) {
          // User picked a different sheet — reject to preserve column mapping integrity on
          // dependent actions. They can delete the connection and create a new one if they
          // genuinely want to switch sheets.
          setPickerError(
            `This connection is bound to a different spreadsheet. Please pick the original sheet, or delete the connection and create a new one to switch.`
          );
          setPickedSheet(null);
          return;
        }
        setPickedSheet(result);
      }
    } catch (error) {
      console.error('Picker failed', error);
      toast.error('Failed to open Google file picker');
    } finally {
      setIsPicking(false);
    }
  }, [oauthSessionId, developerKey, appId, expectedSheetId]);

  const handleSubmit = useCallback(async () => {
    if (!pickedSheet || !oauthSessionId) return;
    try {
      await reconnectMutation.mutateAsync({
        connectionId: connection.id,
        oauthSessionId,
      });
      resetForm();
      onClose();
    } catch {
      // Error toast handled in hook
    }
  }, [pickedSheet, oauthSessionId, reconnectMutation, connection.id, resetForm, onClose]);

  const isValid = !!pickedSheet && !!oauthSessionId && !pickerError;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reconnect Google Account"
      subtitle={`Refresh authorization for "${connection.name}"`}
      maxWidth="lg"
      isLoading={reconnectMutation.isPending}
      closable={!reconnectMutation.isPending && !isConnecting && !isPicking}
    >
      <div className="space-y-5">
        {/* Connection summary */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 shrink-0 text-green-600" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">{connection.name}</p>
              <p className="truncate font-mono text-xs text-neutral-500">{expectedSheetId}</p>
            </div>
          </div>
        </div>

        {/* Step 1: Re-authenticate */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Google Account <span className="text-red-500">*</span>
          </label>
          {!oauthSessionId ? (
            <button
              onClick={handleConnectGoogle}
              disabled={isConnecting || reconnectMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-4 py-4 text-sm font-medium text-neutral-700 transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
                  Connecting…
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Reconnect with Google
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-green-800">Google account connected</p>
              </div>
              <button
                onClick={() => { setOauthSessionId(null); setPickedSheet(null); setPickerError(null); }}
                disabled={reconnectMutation.isPending}
                className="shrink-0 rounded-md p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Re-bind same sheet via Picker */}
        {oauthSessionId && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Confirm spreadsheet <span className="text-red-500">*</span>
            </label>
            {!pickedSheet ? (
              <button
                onClick={handlePickSheet}
                disabled={isPicking || reconnectMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-4 py-4 text-sm font-medium text-neutral-700 transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPicking ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
                    Opening Google Drive…
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    Pick the same spreadsheet again
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <FileSpreadsheet className="h-5 w-5 shrink-0 text-green-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-green-800">{pickedSheet.name}</p>
                  <p className="truncate font-mono text-xs text-green-600">{pickedSheet.id}</p>
                </div>
              </div>
            )}

            {pickerError && (
              <div className="mt-2 flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                <p className="text-xs text-amber-700">{pickerError}</p>
              </div>
            )}

            <p className="mt-1 text-xs text-neutral-400">
              For data integrity, reconnecting requires picking the same spreadsheet. To switch sheets, delete this connection and create a new one.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2 border-t border-neutral-100">
          <button
            onClick={handleClose}
            disabled={reconnectMutation.isPending}
            className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || reconnectMutation.isPending}
            className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {reconnectMutation.isPending ? 'Reconnecting…' : 'Reconnect'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
