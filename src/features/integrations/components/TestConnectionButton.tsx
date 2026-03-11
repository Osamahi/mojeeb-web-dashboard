import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTestConnection } from '../hooks/useIntegrations';
import { FlaskConical, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface TestConnectionButtonProps {
  connectionId: string;
}

export default function TestConnectionButton({ connectionId }: TestConnectionButtonProps) {
  const { t } = useTranslation();
  const testMutation = useTestConnection();
  const [lastResult, setLastResult] = useState<'success' | 'error' | null>(null);

  const handleTest = async () => {
    setLastResult(null);
    try {
      const result = await testMutation.mutateAsync(connectionId);
      setLastResult(result.success ? 'success' : 'error');
    } catch {
      setLastResult('error');
    }
  };

  return (
    <button
      onClick={handleTest}
      disabled={testMutation.isPending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {testMutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : lastResult === 'success' ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : lastResult === 'error' ? (
        <XCircle className="h-4 w-4 text-red-600" />
      ) : (
        <FlaskConical className="h-4 w-4" />
      )}
      {testMutation.isPending ? t('integrations.testing') : t('integrations.test')}
    </button>
  );
}
