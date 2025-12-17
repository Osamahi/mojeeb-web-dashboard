/**
 * Account Selection Step
 * Allows user to select which Facebook page, Instagram account, or WhatsApp number to connect
 */

import { useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useFacebookPages, useWhatsAppAccounts } from '../../hooks/useAddConnection';
import type { FacebookPage, InstagramAccount, WhatsAppPhoneNumber, OAuthIntegrationType } from '../../types';

type AccountSelectStepProps = {
  tempConnectionId: string;
  platform: OAuthIntegrationType;
  onSelect: (pageId: string, instagramAccount?: InstagramAccount, whatsAppPhone?: WhatsAppPhoneNumber) => void;
  onBack: () => void;
  isConnecting: boolean;
};

export function AccountSelectStep({
  tempConnectionId,
  platform,
  onSelect,
  onBack,
  isConnecting,
}: AccountSelectStepProps) {
  // Conditionally fetch data based on platform
  const facebookQuery = useFacebookPages(platform !== 'whatsapp' ? tempConnectionId : null);
  const whatsappQuery = useWhatsAppAccounts(platform === 'whatsapp' ? tempConnectionId : null);

  const { data, isLoading, error, refetch } = platform === 'whatsapp' ? whatsappQuery : facebookQuery;

  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null);
  const [selectedInstagram, setSelectedInstagram] = useState<InstagramAccount | null>(null);
  const [selectedWhatsAppPhone, setSelectedWhatsAppPhone] = useState<WhatsAppPhoneNumber | null>(null);

  const handlePageSelect = useCallback((page: FacebookPage) => {
    setSelectedPage(prev => {
      if (prev?.id === page.id) {
        // Deselect
        setSelectedInstagram(null);
        return null;
      }
      setSelectedInstagram(null);
      return page;
    });
  }, []);

  const handleInstagramSelect = useCallback((account: InstagramAccount) => {
    setSelectedInstagram(prev => (prev?.id === account.id ? null : account));
  }, []);

  const handleWhatsAppPhoneSelect = useCallback((phone: WhatsAppPhoneNumber) => {
    setSelectedWhatsAppPhone(prev => (prev?.id === phone.id ? null : phone));
  }, []);

  const handleConnect = useCallback(() => {
    if (platform === 'whatsapp' && selectedWhatsAppPhone) {
      onSelect('', undefined, selectedWhatsAppPhone);
    } else if (selectedPage) {
      onSelect(selectedPage.id, selectedInstagram || undefined);
    }
  }, [platform, selectedPage, selectedInstagram, selectedWhatsAppPhone, onSelect]);

  // Validate image URL for security (prevent XSS)
  const isValidImageUrl = useCallback((url: string | null): boolean => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return ['https:', 'http:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, []);

  // Format follower count
  const formatFollowers = useMemo(() => (count: number) => {
    if (!Number.isFinite(count) || count < 0) return '0';
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-neutral-900">Loading Pages...</h3>
          <p className="mt-1 text-sm text-neutral-600">Fetching your available pages</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorState
          icon={<AlertCircle className="h-12 w-12" />}
          title="Failed to Load Pages"
          description={error.message || 'Unable to fetch your pages. Please try again.'}
          onRetry={() => refetch()}
          retryLabel="Retry"
        />
        <div className="flex justify-start">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  // Check for empty data based on platform
  const isEmpty = platform === 'whatsapp'
    ? (!data?.whatsAppAccounts || data.whatsAppAccounts.length === 0)
    : (!data?.pages || data.pages.length === 0);

  if (isEmpty) {
    const emptyMessage = platform === 'whatsapp'
      ? {
          title: 'No WhatsApp Business Accounts Found',
          description: 'We couldn\'t find any WhatsApp Business accounts. Make sure you have a WhatsApp Business Account set up in Meta Business Suite.',
        }
      : {
          title: 'No Pages Found',
          description: 'We couldn\'t find any Facebook pages you have admin access to. Make sure you\'re an admin of the page you want to connect.',
        };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="mt-4 text-lg font-semibold text-neutral-900">{emptyMessage.title}</h3>
          <p className="mt-2 text-sm text-neutral-600">
            {emptyMessage.description}
          </p>
        </div>
        <div className="flex justify-start">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-neutral-900">
          {platform === 'whatsapp' ? 'Select WhatsApp Number' : 'Select Page to Connect'}
        </h3>
      </div>

      {/* WhatsApp accounts list */}
      {platform === 'whatsapp' && data.whatsAppAccounts && (
        <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
          {data.whatsAppAccounts.map(waba => (
            <div key={waba.id} className="space-y-2">
              {/* Business Account Header */}
              <div className="text-xs font-medium text-neutral-600 px-3">
                {waba.name}
              </div>

              {/* Phone Numbers */}
              {(waba.phoneNumbers || []).map(phone => (
                <button
                  key={phone.id}
                  onClick={() => handleWhatsAppPhoneSelect(phone)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
                    selectedWhatsAppPhone?.id === phone.id
                      ? 'border-green-600 bg-green-50 ring-1 ring-green-600'
                      : 'border-neutral-200 bg-white hover:border-neutral-400'
                  )}
                >
                  {/* WhatsApp icon */}
                  <div className="relative flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    {selectedWhatsAppPhone?.id === phone.id && (
                      <div className="absolute -right-1 -top-1 rounded-full bg-green-600 p-0.5">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Phone info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="truncate font-medium text-neutral-900">
                      {phone.displayPhoneNumber}
                    </h4>
                    {phone.verifiedName && (
                      <p className="text-xs text-neutral-500">{phone.verifiedName}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Pages list (Facebook/Instagram) */}
      {platform !== 'whatsapp' && data.pages && (
        <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
          {data.pages.map(page => (
          <div key={page.id} className="space-y-2">
            {/* Facebook Page */}
            <button
              onClick={() => handlePageSelect(page)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
                selectedPage?.id === page.id
                  ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                  : 'border-neutral-200 bg-white hover:border-neutral-400'
              )}
            >
              {/* Page avatar */}
              <div className="relative flex-shrink-0">
                {isValidImageUrl(page.profilePictureUrl) ? (
                  <img
                    src={page.profilePictureUrl!}
                    alt={`${page.name} profile`}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                )}
                {selectedPage?.id === page.id && (
                  <div className="absolute -right-1 -top-1 rounded-full bg-neutral-900 p-0.5">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              {/* Page info */}
              <div className="flex-1 min-w-0">
                <h4 className="truncate font-medium text-neutral-900">{page.name}</h4>
                <p className="text-xs text-neutral-500">{page.category}</p>
                <p className="text-xs text-neutral-500">{formatFollowers(page.followerCount)} followers</p>
              </div>

              {/* Instagram indicator */}
              {page.instagramAccounts.length > 0 && (
                <div className="flex-shrink-0">
                  <Badge variant="default" className="text-xs font-semibold px-3 py-1">
                    {page.instagramAccounts.length} IG
                  </Badge>
                </div>
              )}
            </button>

            {/* Nested Instagram accounts */}
            {selectedPage?.id === page.id &&
              page.instagramAccounts.length > 0 &&
              platform === 'instagram' && (
                <div className="ml-6 space-y-2 border-l-2 border-neutral-200 pl-4">
                  <p className="text-xs font-medium text-neutral-600">Select Instagram Account:</p>
                  {page.instagramAccounts.map(ig => (
                    <button
                      key={ig.id}
                      onClick={() => handleInstagramSelect(ig)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
                        selectedInstagram?.id === ig.id
                          ? 'border-pink-500 bg-pink-50 ring-1 ring-pink-500'
                          : 'border-neutral-200 bg-white hover:border-neutral-400'
                      )}
                    >
                      {/* IG avatar */}
                      <div className="relative flex-shrink-0">
                        {isValidImageUrl(ig.profilePictureUrl) ? (
                          <img
                            src={ig.profilePictureUrl!}
                            alt={`Instagram profile picture for @${ig.username}`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" />
                            </svg>
                          </div>
                        )}
                        {selectedInstagram?.id === ig.id && (
                          <div className="absolute -right-1 -top-1 rounded-full bg-pink-500 p-0.5">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>

                      {/* IG info */}
                      <div className="flex-1 min-w-0">
                        <h5 className="truncate font-medium text-neutral-900">@{ig.username}</h5>
                        <p className="text-xs text-neutral-500">{formatFollowers(ig.followerCount)} followers</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} disabled={isConnecting}>
          Back
        </Button>
        <Button
          onClick={handleConnect}
          disabled={
            isConnecting ||
            (platform === 'whatsapp' ? !selectedWhatsAppPhone : !selectedPage) ||
            (platform === 'instagram' && !selectedInstagram)
          }
          isLoading={isConnecting}
        >
          {isConnecting
            ? 'Connecting...'
            : platform === 'whatsapp'
            ? 'Connect WhatsApp'
            : `Connect ${platform === 'instagram' && selectedInstagram ? 'Instagram' : 'Facebook'}`}
        </Button>
      </div>

      {/* Help text */}
      {platform === 'instagram' && selectedPage && selectedPage.instagramAccounts.length === 0 && (
        <div className="rounded-lg bg-yellow-50 p-3">
          <p className="text-xs text-yellow-700">
            <strong>No Instagram account linked.</strong> This Facebook page doesn't have a linked Instagram
            Business account. Please link one in Facebook's Business Suite first.
          </p>
        </div>
      )}
    </div>
  );
}
