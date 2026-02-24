import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Plus, Loader2, Pencil, ChevronDown } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useDateLocale } from '@/lib/dateConfig';
import { appConfigService } from '../services/appConfigService';
import AppConfigModal from '../components/AppConfigModal';
import type { AppConfigItem } from '../types/appconfig.types';

export default function AdminAppConfigPage() {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_app_config');
  const { formatSmartTimestamp } = useDateLocale();

  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AppConfigItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['admin-app-configs'],
    queryFn: () => appConfigService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const handleAdd = useCallback(() => {
    setEditingConfig(null);
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((config: AppConfigItem) => {
    setEditingConfig(config);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingConfig(null);
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // Sort by key alphabetically
  const sortedConfigs = [...configs].sort((a, b) => a.key.localeCompare(b.key));

  return (
    <div className="space-y-6 p-6">
      <BaseHeader
        title={t('app_config.title')}
        subtitle={t('app_config.subtitle')}
        primaryAction={{
          label: t('app_config.add_button'),
          icon: Plus,
          onClick: handleAdd,
        }}
      />

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : sortedConfigs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <p className="text-lg font-medium">{t('app_config.no_configs_title')}</p>
            <p className="text-sm mt-1">{t('app_config.no_configs_subtitle')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider w-8" />
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('app_config.col_key')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('app_config.col_value')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('app_config.col_description')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('app_config.col_updated')}
                  </th>
                  <th className="px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    {t('app_config.col_actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {sortedConfigs.map((config) => {
                  const isExpanded = expandedId === config.id;
                  return (
                    <tr
                      key={config.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(config.id)}
                    >
                      <td className="ps-6 py-4 w-8">
                        <ChevronDown
                          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="font-mono text-sm text-gray-900">{config.key}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p
                          className={`text-sm text-gray-600 max-w-xs ${
                            isExpanded ? 'whitespace-pre-wrap break-words' : 'truncate'
                          }`}
                        >
                          {config.value}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p
                          className={`text-sm text-gray-500 max-w-xs ${
                            isExpanded ? 'whitespace-pre-wrap break-words' : 'truncate'
                          }`}
                        >
                          {config.description || '—'}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {formatSmartTimestamp(config.updatedAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(config);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                          title={t('app_config.edit_button')}
                        >
                          <Pencil className="h-4 w-4" />
                          {t('app_config.edit_button')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AppConfigModal
        isOpen={showModal}
        onClose={handleCloseModal}
        config={editingConfig}
      />
    </div>
  );
}
