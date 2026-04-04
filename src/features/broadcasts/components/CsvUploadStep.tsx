import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BroadcastRecipientInput, CsvValidationResult } from '../types/broadcast.types';

interface CsvUploadStepProps {
  campaignName: string;
  onCampaignNameChange: (name: string) => void;
  onValidated: (result: CsvValidationResult) => void;
  validationResult: CsvValidationResult | null;
}

const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

function parseCsv(text: string, t: (key: string) => string): CsvValidationResult {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { valid: [], invalid: [], duplicatesRemoved: 0, totalRows: 0 };
  }

  const header = lines[0].toLowerCase();
  const delimiter = header.includes('\t') ? '\t' : header.includes(';') ? ';' : ',';
  const columns = header.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));

  const phoneIdx = columns.findIndex((c) => ['phone', 'phone_number', 'phonenumber', 'mobile', 'number', 'whatsapp'].includes(c));
  const nameIdx = columns.findIndex((c) => ['name', 'full_name', 'fullname', 'contact_name', 'contact'].includes(c));

  if (phoneIdx === -1) {
    return {
      valid: [],
      invalid: [{ phone: '', reason: t('broadcasts.csv_no_phone_col') }],
      duplicatesRemoved: 0,
      totalRows: lines.length - 1,
    };
  }

  const valid: BroadcastRecipientInput[] = [];
  const invalid: { phone: string; name?: string; reason: string }[] = [];
  const seen = new Set<string>();
  let duplicatesRemoved = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    const rawPhone = cols[phoneIdx]?.trim() || '';
    const name = nameIdx >= 0 ? cols[nameIdx]?.trim() : undefined;

    let phone = rawPhone;
    if (phone && !phone.startsWith('+')) {
      phone = '+' + phone;
    }

    if (!PHONE_REGEX.test(phone)) {
      invalid.push({ phone: rawPhone, name, reason: t('broadcasts.csv_invalid_format') });
      continue;
    }

    if (seen.has(phone)) {
      duplicatesRemoved++;
      continue;
    }

    seen.add(phone);
    valid.push({ phone, name: name || undefined });
  }

  return { valid, invalid, duplicatesRemoved, totalRows: lines.length - 1 };
}

export function CsvUploadStep({ campaignName, onCampaignNameChange, onValidated, validationResult }: CsvUploadStepProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const result = parseCsv(text, t);
        onValidated(result);
      };
      reader.readAsText(file);
    },
    [onValidated, t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">{t('broadcasts.csv_campaign_name')}</label>
        <input
          type="text"
          value={campaignName}
          onChange={(e) => onCampaignNameChange(e.target.value)}
          placeholder={t('broadcasts.csv_campaign_placeholder')}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">{t('broadcasts.csv_upload_label')}</label>
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-neutral-400 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <Upload className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
          <p className="text-sm text-neutral-600">
            {fileName ? (
              <span className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                {fileName}
              </span>
            ) : (
              <>{t('broadcasts.csv_drag_drop')}</>
            )}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {t('broadcasts.csv_required_col')} <code className="bg-neutral-100 px-1 rounded">phone</code> &middot; {t('broadcasts.csv_optional_col')} <code className="bg-neutral-100 px-1 rounded">name</code>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {validationResult && (
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              {t('broadcasts.csv_valid', { count: validationResult.valid.length })}
            </span>
            {validationResult.invalid.length > 0 && (
              <span className="flex items-center gap-1 text-red-500">
                <X className="w-4 h-4" />
                {t('broadcasts.csv_invalid', { count: validationResult.invalid.length })}
              </span>
            )}
            {validationResult.duplicatesRemoved > 0 && (
              <span className="text-neutral-400">
                {t('broadcasts.csv_duplicates', { count: validationResult.duplicatesRemoved })}
              </span>
            )}
          </div>

          {validationResult.invalid.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 max-h-32 overflow-y-auto">
              <div className="flex items-center gap-1 text-xs font-medium text-red-700 mb-1">
                <AlertTriangle className="w-3 h-3" />
                {t('broadcasts.csv_invalid_numbers')}
              </div>
              {validationResult.invalid.map((item, i) => (
                <div key={i} className="text-xs text-red-600">
                  {item.phone || '(empty)'} — {item.reason}
                </div>
              ))}
            </div>
          )}

          {validationResult.valid.some((r) => r.phone.startsWith('+1')) && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-700">
                {t('broadcasts.csv_us_warning')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
