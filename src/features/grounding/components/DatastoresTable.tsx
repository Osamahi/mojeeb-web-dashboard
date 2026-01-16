/**
 * Datastores Table
 * Displays Vertex AI datastores in a table format
 */

import { formatDistanceToNow } from 'date-fns';
import { Database, HardDrive, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Datastore } from '../types/grounding.types';

interface DatastoresTableProps {
  datastores: Datastore[];
}

const formatBytes = (bytes: string | undefined): string => {
  if (!bytes) return 'N/A';
  const numBytes = parseInt(bytes, 10);
  if (isNaN(numBytes)) return 'N/A';

  if (numBytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  return Math.round((numBytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const extractDatastoreId = (name: string): string => {
  const parts = name.split('/');
  return parts[parts.length - 1];
};

export const DatastoresTable = ({ datastores }: DatastoresTableProps) => {
  const navigate = useNavigate();

  const handleRowClick = (datastoreId: string) => {
    navigate(`/grounding/${datastoreId}`);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700">
              Datastore
            </th>
            <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700">
              Type
            </th>
            <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700">
              Solution
            </th>
            <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700">
              Data Size
            </th>
            <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700">
              Created
            </th>
            <th className="w-12"></th>
          </tr>
        </thead>
        <tbody>
          {datastores.map((datastore) => {
            const datastoreId = extractDatastoreId(datastore.name);
            const totalSize =
              (parseInt(datastore.billingEstimation?.structuredDataSize || '0', 10) +
              parseInt(datastore.billingEstimation?.unstructuredDataSize || '0', 10)).toString();

            return (
              <tr
                key={datastore.name}
                onClick={() => handleRowClick(datastoreId)}
                className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                <td className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <Database className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-neutral-900">
                        {datastore.displayName}
                      </div>
                      <div className="text-sm text-neutral-500 font-mono">
                        {datastoreId}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                    {datastore.contentConfig.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-neutral-900">
                    {datastore.solutionTypes.map(type =>
                      type.replace('SOLUTION_TYPE_', '')
                    ).join(', ')}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-900">
                      {formatBytes(totalSize)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-neutral-900">
                    {formatDistanceToNow(new Date(datastore.createTime), {
                      addSuffix: true,
                    })}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
