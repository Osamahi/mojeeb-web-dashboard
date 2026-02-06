import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useExamineTokenMutation } from '../hooks/useExamineTokenMutation';
import { adminConnectionService } from '@/features/connections/services/adminConnectionService';
import type { TokenExaminationResult } from '../types/metaToken.types';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export function MetaTokenExaminerPage() {
  useDocumentTitle('Meta Token Examiner');

  const [searchParams] = useSearchParams();
  const connectionId = searchParams.get('connectionId');

  const [token, setToken] = useState('');
  const [result, setResult] = useState<TokenExaminationResult | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const examineMutation = useExamineTokenMutation();

  // Auto-fetch token when connectionId is present
  useEffect(() => {
    if (!connectionId) {
      return;
    }

    const fetchTokenAndExamine = async () => {
      setIsLoadingToken(true);
      setTokenError(null);
      try {
        const { accessToken } = await adminConnectionService.getConnectionToken(connectionId);
        if (accessToken) {
          setToken(accessToken);
          // Auto-trigger examination
          examineMutation.mutate(accessToken, {
            onSuccess: (data) => {
              setResult(data);
            },
          });
        } else {
          setTokenError('No access token found for this connection');
        }
      } catch (error) {
        console.error('Failed to fetch connection token:', error);
        setTokenError('Failed to fetch token. Please try again.');
      } finally {
        setIsLoadingToken(false);
      }
    };

    fetchTokenAndExamine();
  }, [connectionId]);

  const handleExamine = () => {
    if (!token.trim()) {
      return;
    }

    examineMutation.mutate(token, {
      onSuccess: (data) => {
        setResult(data);
      },
    });
  };

  const isLoading = examineMutation.isPending || isLoadingToken;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <BaseHeader
        title="Meta Token Examiner"
        subtitle="Examine Meta platform access tokens (SuperAdmin only)"
      />

      {/* Token Input Form */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <label
          htmlFor="token-input"
          className="block text-sm font-medium text-neutral-700 mb-2"
        >
          Meta Access Token
        </label>
        <textarea
          id="token-input"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste your Meta access token here..."
          className="w-full h-32 px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono text-sm"
          disabled={isLoading}
        />
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleExamine}
            disabled={!token.trim() || isLoading}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Examining...' : 'Examine Token'}
          </button>
          {token && !isLoading && (
            <button
              onClick={() => {
                setToken('');
                setResult(null);
              }}
              className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Token Error Display */}
      {tokenError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Loading Token</h3>
              <p className="text-sm text-red-700 mt-1">{tokenError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Basic Token Info */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Token Validation
            </h2>
            {result.basicInfo ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {result.basicInfo.isValid ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span
                    className={`font-medium ${
                      result.basicInfo.isValid ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {result.basicInfo.isValid ? 'Valid Token' : 'Invalid Token'}
                  </span>
                </div>
                {result.basicInfo.ownerName && (
                  <div>
                    <span className="text-sm font-medium text-neutral-600">Owner: </span>
                    <span className="text-sm text-neutral-900">
                      {result.basicInfo.ownerName}
                    </span>
                  </div>
                )}
                {result.basicInfo.ownerId && (
                  <div>
                    <span className="text-sm font-medium text-neutral-600">Owner ID: </span>
                    <span className="text-sm text-neutral-500 font-mono">
                      {result.basicInfo.ownerId}
                    </span>
                  </div>
                )}
                {result.basicInfo.error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-red-700">{result.basicInfo.error}</span>
                  </div>
                )}
                {/* Token Permissions */}
                {result.basicInfo.permissions && result.basicInfo.permissions.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-neutral-700 mb-2">
                      Token Permissions ({result.basicInfo.permissions.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.basicInfo.permissions.map((perm, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 text-xs rounded-md ${
                            perm.status === 'granted'
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : 'bg-red-100 text-red-700 border border-red-300'
                          }`}
                        >
                          {perm.permission}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No basic info available</p>
            )}
          </div>

          {/* WhatsApp Accounts */}
          {result.whatsAppAccounts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                WhatsApp Business Accounts ({result.whatsAppAccounts.length})
              </h2>
              <div className="space-y-4">
                {result.whatsAppAccounts.map((waba) => (
                  <div
                    key={waba.id}
                    className="border border-neutral-200 rounded-md p-4 space-y-3"
                  >
                    <div>
                      <h3 className="font-medium text-neutral-900">{waba.name}</h3>
                      <p className="text-xs text-neutral-500 font-mono">{waba.id}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {waba.accountReviewStatus && (
                        <div>
                          <span className="font-medium text-neutral-600">Review Status: </span>
                          <span
                            className={`${
                              waba.accountReviewStatus === 'APPROVED'
                                ? 'text-green-600'
                                : waba.accountReviewStatus === 'PENDING'
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {waba.accountReviewStatus}
                          </span>
                        </div>
                      )}
                      {waba.businessVerificationStatus && (
                        <div>
                          <span className="font-medium text-neutral-600">Verification: </span>
                          <span className="text-neutral-900">
                            {waba.businessVerificationStatus}
                          </span>
                        </div>
                      )}
                    </div>
                    {waba.phoneNumbers.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-neutral-700 mb-2">
                          Phone Numbers
                        </h4>
                        <div className="space-y-2">
                          {waba.phoneNumbers.map((phone) => (
                            <div
                              key={phone.id}
                              className="bg-neutral-50 border border-neutral-200 rounded p-3 text-sm space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-neutral-900">
                                    {phone.displayPhoneNumber}
                                  </span>
                                  {phone.isOfficialBusinessAccount && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded border border-blue-300">
                                      Official
                                    </span>
                                  )}
                                </div>
                                {phone.codeVerificationStatus === 'VERIFIED' ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-neutral-400" />
                                )}
                              </div>

                              {phone.verifiedName && (
                                <div className="text-neutral-600">
                                  <span className="font-medium">Name:</span> {phone.verifiedName}
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-2">
                                {phone.accountMode && (
                                  <div>
                                    <span className="font-medium text-neutral-600">Mode: </span>
                                    <span
                                      className={`${
                                        phone.accountMode === 'LIVE'
                                          ? 'text-green-600 font-medium'
                                          : 'text-yellow-600'
                                      }`}
                                    >
                                      {phone.accountMode}
                                    </span>
                                  </div>
                                )}

                                {phone.status && (
                                  <div>
                                    <span className="font-medium text-neutral-600">Status: </span>
                                    <span
                                      className={`${
                                        phone.status === 'CONNECTED'
                                          ? 'text-green-600'
                                          : phone.status === 'PENDING'
                                            ? 'text-yellow-600'
                                            : 'text-neutral-600'
                                      }`}
                                    >
                                      {phone.status}
                                    </span>
                                  </div>
                                )}

                                {phone.qualityRating && (
                                  <div>
                                    <span className="font-medium text-neutral-600">Quality: </span>
                                    <span className="text-neutral-900">{phone.qualityRating}</span>
                                  </div>
                                )}

                                {phone.messagingLimitTier && (
                                  <div>
                                    <span className="font-medium text-neutral-600">Limit: </span>
                                    <span className="text-neutral-900">{phone.messagingLimitTier}</span>
                                  </div>
                                )}

                                {phone.platformType && (
                                  <div>
                                    <span className="font-medium text-neutral-600">Platform: </span>
                                    <span className="text-neutral-900">{phone.platformType}</span>
                                  </div>
                                )}

                                {phone.nameStatus && (
                                  <div>
                                    <span className="font-medium text-neutral-600">Name Status: </span>
                                    <span className="text-neutral-900">{phone.nameStatus}</span>
                                  </div>
                                )}
                              </div>

                              {phone.webhookUrl && (
                                <div className="text-neutral-500 text-xs break-all">
                                  <span className="font-medium">Webhook:</span> {phone.webhookUrl}
                                </div>
                              )}

                              {phone.certificate && (
                                <div className="text-neutral-500 text-xs break-all">
                                  <span className="font-medium">Certificate:</span> {phone.certificate}
                                </div>
                              )}

                              <div className="text-xs text-neutral-400 font-mono pt-1 border-t border-neutral-200">
                                ID: {phone.id}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Facebook Pages */}
          {result.facebookPages.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Facebook Pages ({result.facebookPages.length})
              </h2>
              <div className="grid gap-4">
                {result.facebookPages.map((page) => (
                  <div key={page.id} className="border border-neutral-200 rounded-md p-4 space-y-3">
                    <div>
                      <h3 className="font-medium text-neutral-900 text-lg">{page.name}</h3>
                      <p className="text-xs text-neutral-500 font-mono">{page.id}</p>
                    </div>

                    {page.about && (
                      <div className="text-sm text-neutral-600">
                        <span className="font-medium">About:</span> {page.about}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {page.category && (
                        <div>
                          <span className="font-medium text-neutral-600">Category: </span>
                          <span className="text-neutral-900">{page.category}</span>
                        </div>
                      )}

                      {page.phone && (
                        <div>
                          <span className="font-medium text-neutral-600">Phone: </span>
                          <span className="text-neutral-900">{page.phone}</span>
                        </div>
                      )}

                      {page.website && (
                        <div className="col-span-2">
                          <span className="font-medium text-neutral-600">Website: </span>
                          <a
                            href={page.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline break-all"
                          >
                            {page.website}
                          </a>
                        </div>
                      )}

                      {(page.followersCount !== null || page.fanCount !== null) && (
                        <>
                          {page.followersCount !== null && (
                            <div>
                              <span className="font-medium text-neutral-600">Followers: </span>
                              <span className="text-neutral-900">
                                {page.followersCount.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {page.fanCount !== null && (
                            <div>
                              <span className="font-medium text-neutral-600">Likes: </span>
                              <span className="text-neutral-900">
                                {page.fanCount.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {page.categoryList && page.categoryList.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-neutral-600">Categories: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {page.categoryList.map((cat) => (
                            <span
                              key={cat.id}
                              className="px-2 py-0.5 bg-neutral-100 text-neutral-700 text-xs rounded"
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {page.tasks.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-neutral-600">Tasks: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {page.tasks.map((task) => (
                            <span
                              key={task}
                              className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded border border-blue-300"
                            >
                              {task}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Business Accounts */}
          {result.businessAccounts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Business Manager Accounts ({result.businessAccounts.length})
              </h2>
              <div className="grid gap-3">
                {result.businessAccounts.map((business) => (
                  <div key={business.id} className="border border-neutral-200 rounded-md p-4">
                    <h3 className="font-medium text-neutral-900">{business.name}</h3>
                    <p className="text-xs text-neutral-500 font-mono">{business.id}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {result.basicInfo?.isValid &&
            result.whatsAppAccounts.length === 0 &&
            result.facebookPages.length === 0 &&
            result.businessAccounts.length === 0 && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center">
                <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-600">
                  Token is valid but no accounts found. This token may have limited permissions.
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
