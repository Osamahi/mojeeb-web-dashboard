import { useState } from 'react';
import { Upload, Search, FileText, TrendingUp } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { Button } from '@/components/ui/Button';
import { usePineconeUpload } from '../hooks/usePineconeUpload';
import { usePineconeSearch } from '../hooks/usePineconeSearch';
import type { PineconeMatch } from '../types/pineconeTest.types';

const TEST_AGENT_ID = '3f35d88d-536e-43a7-abf1-8d286a01c474';

export default function PineconeTestPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'search'>('upload');

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; chunks?: number; error?: string } | null>(null);

  // Search form state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PineconeMatch[]>([]);

  const uploadMutation = usePineconeUpload();
  const searchMutation = usePineconeSearch();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null); // Clear previous result
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      // Synchronous upload - waits for complete result
      const result = await uploadMutation.mutateAsync({
        agentId: TEST_AGENT_ID,
        file: selectedFile,
      });

      if (result.success) {
        setUploadResult({ success: true, chunks: result.data?.chunksUploaded });
        // Clear file after 2 seconds
        setTimeout(() => {
          setSelectedFile(null);
          setUploadResult(null);
        }, 2000);
      } else {
        setUploadResult({ success: false, error: result.error || 'Upload failed' });
      }
    } catch (error) {
      setUploadResult({ success: false, error: error instanceof Error ? error.message : 'Upload failed' });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    const result = await searchMutation.mutateAsync({
      agent_id: TEST_AGENT_ID,
      query: searchQuery,
    });

    if (result.success && result.matches) {
      setSearchResults(result.matches);
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <BaseHeader
        title="Pinecone Engine Test"
        subtitle="Test document upload and semantic search with reranking"
      />

      {/* Content */}
      <div className="max-w-5xl mx-auto space-y-4">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg border border-neutral-200 p-1 inline-flex shadow-sm">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'upload'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'search'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Search className="w-4 h-4" />
              Search Documents
            </button>
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-brand-cyan" />
                Upload Document
              </h2>

              <div className="space-y-4">
                {/* File Upload Input */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select File
                  </label>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="file-upload"
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-center gap-3 px-4 py-8 border-2 border-dashed border-neutral-300 rounded-lg hover:border-brand-cyan hover:bg-brand-cyan/5 transition-colors">
                        <Upload className="w-6 h-6 text-neutral-400" />
                        <div className="text-center">
                          {selectedFile ? (
                            <div>
                              <p className="text-sm font-medium text-neutral-900">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {(selectedFile.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-medium text-neutral-700">
                                Click to select a file
                              </p>
                              <p className="text-xs text-neutral-500">
                                or drag and drop
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={uploadMutation.isPending}
                        accept=".txt,.pdf,.docx,.csv,.xlsx,.xls"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    Supported formats: .txt, .pdf, .docx, .csv, .xlsx, .xls (Max 10MB)
                  </p>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadMutation.isPending}
                  isLoading={uploadMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {!uploadMutation.isPending && <Upload className="w-4 h-4 mr-2" />}
                  {uploadResult ? (
                    uploadResult.success ? (
                      `✓ Upload Complete - ${uploadResult.chunks} chunks`
                    ) : (
                      `✗ ${uploadResult.error}`
                    )
                  ) : uploadMutation.isPending ? (
                    'Uploading... (this may take 10-30 seconds)'
                  ) : (
                    'Upload Document'
                  )}
                </Button>

                {uploadResult && !uploadResult.success && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {uploadResult.error}
                  </div>
                )}

                <div className="text-xs text-neutral-500 space-y-1">
                  <p>• Test Agent ID: {TEST_AGENT_ID}</p>
                  <p>• Chunking: 250 characters per chunk with 50-character overlap</p>
                  <p>• Processing: Synchronous upload (waits for complete result, no progress tracking)</p>
                </div>
              </div>
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <>
              <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5 text-brand-cyan" />
                  Search Documents
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Search Query
                    </label>
                    <textarea
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="What would you like to search for?"
                      rows={4}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan resize-none"
                      disabled={searchMutation.isPending}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handleSearch();
                        }
                      }}
                    />
                  </div>

                  <Button
                    onClick={handleSearch}
                    disabled={!searchQuery.trim() || searchMutation.isPending}
                    isLoading={searchMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {!searchMutation.isPending && <Search className="w-4 h-4 mr-2" />}
                    {searchMutation.isPending ? 'Searching...' : 'Search'}
                  </Button>

                  <div className="text-xs text-neutral-500 space-y-1">
                    <p>• Test Agent ID: {TEST_AGENT_ID}</p>
                    <p>• Two-stage retrieval: Top 100 candidates → Reranked to top 5 results</p>
                  </div>
                </div>
              </div>

              {/* Search Results */}
              {searchMutation.isPending && <LoadingSkeleton />}

              {!searchMutation.isPending && searchResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Results ({searchResults.length})
                  </h3>
                  {searchResults.map((match, index) => (
                    <ResultCard key={match.id} match={match} index={index} />
                  ))}
                </div>
              )}

              {!searchMutation.isPending && searchResults.length === 0 && searchQuery && (
                <EmptyState message="No results found. Try uploading documents first or use a different search query." />
              )}

              {!searchMutation.isPending && searchResults.length === 0 && !searchQuery && (
                <EmptyState message="Enter a search query to find relevant documents" />
              )}
            </>
          )}
        </div>
    </div>
  );
}

/**
 * Result Card Component
 */
function ResultCard({ match, index }: { match: PineconeMatch; index: number }) {
  const scorePercentage = (match.score * 100).toFixed(1);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-semibold text-neutral-600">{index + 1}.</span>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-cyan" />
          <span className="px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/30 text-sm font-medium text-brand-cyan">
            Score: {scorePercentage}%
          </span>
        </div>
      </div>

      {/* Chunk Text */}
      <div className="mb-3">
        <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
          {match.chunk_text || 'No text available'}
        </p>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <FileText className="w-4 h-4" />
        <span className="font-medium">{match.filename || 'Unknown'}</span>
        <span className="text-neutral-400">•</span>
        <span>
          Chunk {(match.chunk_index ?? 0) + 1} of {match.total_chunks || 'N/A'}
        </span>
        <span className="text-neutral-400">•</span>
        <span className="text-xs text-neutral-400 truncate">{match.document_id}</span>
      </div>
    </div>
  );
}

/**
 * Loading Skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-neutral-200 p-5 shadow-sm"
        >
          <div className="space-y-3">
            <div className="h-6 w-24 bg-neutral-200 rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-neutral-200 rounded animate-pulse" />
              <div className="h-4 bg-neutral-200 rounded animate-pulse w-3/4" />
            </div>
            <div className="h-4 w-48 bg-neutral-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty State Component
 */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
      <div className="max-w-sm mx-auto">
        <Search className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
        <p className="text-neutral-600">{message}</p>
      </div>
    </div>
  );
}
