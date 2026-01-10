import { useState } from 'react';
import { Search, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { useEmbeddingSearch } from '../hooks/useEmbeddingSearch';
import {
  getSimilarityLevel,
  getSimilarityColor,
  getSimilarityEmoji,
  type EmbeddingSearchResult,
} from '../types/embeddingTest.types';

export default function EmbeddingTestPage() {
  const [queryText, setQueryText] = useState('');
  const [searchResults, setSearchResults] = useState<EmbeddingSearchResult[]>([]);
  const searchMutation = useEmbeddingSearch();

  const handleSearch = async () => {
    if (!queryText.trim()) {
      return;
    }

    const results = await searchMutation.mutateAsync({ queryText: queryText.trim() });
    setSearchResults(results);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !searchMutation.isPending) {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <BaseHeader
        title="Embedding Retrieval Quality Test"
        subtitle="Test embedding search quality for agent 3f35d88d-536e-43a7-abf1-8d286a01c474"
      />

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Search Input */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Search Query
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter a search query to test embedding retrieval..."
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={searchMutation.isPending}
              />
              <button
                onClick={handleSearch}
                disabled={!queryText.trim() || searchMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                <Search className="w-4 h-4" />
                {searchMutation.isPending ? 'Searching...' : 'Search'}
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Fixed parameters: limit=5, threshold=0.0
            </p>
          </div>

          {/* Results Section */}
          {searchMutation.isPending && <LoadingSkeleton />}

          {!searchMutation.isPending && searchResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                📊 Results ({searchResults.length})
              </h2>
              {searchResults.map((result, index) => (
                <ResultCard key={result.chunkId} result={result} index={index} />
              ))}
            </div>
          )}

          {!searchMutation.isPending && searchResults.length === 0 && queryText && (
            <EmptyState message="No results found. Try a different search query." />
          )}

          {!searchMutation.isPending && searchResults.length === 0 && !queryText && (
            <EmptyState message="Enter a search query to test embedding retrieval" />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Result Card Component
 */
function ResultCard({ result, index }: { result: EmbeddingSearchResult; index: number }) {
  const [isExpanded, setIsExpanded] = useState(true); // Default to expanded
  const similarityLevel = getSimilarityLevel(result.similarityScore);
  const colorClass = getSimilarityColor(similarityLevel);
  const emoji = getSimilarityEmoji(similarityLevel);

  const shouldTruncate = result.chunkText.length > 200;
  const displayText = isExpanded || !shouldTruncate
    ? result.chunkText
    : result.chunkText.substring(0, 200) + '...';

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-semibold text-neutral-600">
          {index + 1}.
        </span>
        <div className={`px-3 py-1 rounded-full border text-sm font-medium ${colorClass}`}>
          {emoji} Similarity: {result.similarityScore.toFixed(3)}
        </div>
      </div>

      {/* Chunk Text */}
      <div className="mb-3">
        <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
          {displayText}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                Show less <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show more <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <FileText className="w-4 h-4" />
        <span className="font-medium">{result.knowledgeBaseName}</span>
        <span className="text-neutral-400">•</span>
        <span>Chunk {result.chunkIndex}</span>
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
        <div key={i} className="bg-white rounded-lg border border-neutral-200 p-5 shadow-sm">
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
