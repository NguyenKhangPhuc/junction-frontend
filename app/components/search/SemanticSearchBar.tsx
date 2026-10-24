'use client';

import { useState, useRef, useEffect } from 'react';
import { useDebounce } from '@/app/hooks/useDebounce';
import { useArticleSearch } from '@/app/hooks/useArticleSearch';
import { ArticleSearchResultItem } from '@/app/types/article';

export function SemanticSearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce the user input by 350ms to minimize network traffic
  const debouncedQuery = useDebounce(query, 350);

  // Execute pgvector semantic search query using TanStack Query
  const { data, isLoading, isFetching } = useArticleSearch(
    {
      query: debouncedQuery,
      limit: 6,
      min_similarity: 0.5,
    },
    debouncedQuery.trim().length > 0
  );

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 0.8) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    }
    if (score >= 0.65) {
      return 'bg-sky-50 text-sky-800 border-sky-300';
    }
    return 'bg-surface-container text-on-surface border-surface-container-high';
  };

  const hasResults = data && data.results && data.results.length > 0;
  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Box */}
      <div className="relative flex items-center w-full">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant flex items-center">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
          placeholder="Semantic similarity search: e.g. 'trí tuệ nhân tạo y tế', 'Nordic robotics', 'arctic energy'..."
          className="w-full h-12 pl-11 pr-24 rounded-xl bg-surface-container-lowest border border-surface-container-high text-on-surface placeholder:text-on-surface-variant font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-sm transition-all"
        />

        {/* Right utility indicators */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isFetching && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container text-[11px] font-body text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              <span>Analyzing</span>
            </div>
          )}

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container text-xs cursor-pointer"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}

          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-surface-container-low text-[10px] font-mono uppercase tracking-wider text-secondary border border-surface-container-high/60">
            E5 Model
          </span>
        </div>
      </div>

      {/* High Z-Index Floating Results Panel */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-surface-container-lowest border border-surface-container-high rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Header metadata */}
          <div className="px-5 py-3 bg-surface-container-low/70 border-b border-surface-container-high flex items-center justify-between text-xs font-body text-secondary">
            <span className="font-semibold text-primary">
              {isLoading
                ? 'Processing semantic embeddings...'
                : hasResults
                ? `${data?.total_results} Semantic Matches Found (Cosine Distance)`
                : 'No matching articles found'}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
              Model: intfloat/multilingual-e5-large
            </span>
          </div>

          {/* Results list */}
          <div className="max-h-[480px] overflow-y-auto divide-y divide-surface-container-high/40">
            {isLoading && (
              <div className="p-8 text-center text-sm font-body text-secondary space-y-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Generating 1024-dim query vector and calculating cosine distances...</p>
              </div>
            )}

            {!isLoading && hasResults && (
              data?.results.map((article: ArticleSearchResultItem) => {
                const matchPercent = (article.similarity_score * 100).toFixed(1);
                return (
                  <article
                    key={article.id}
                    className="p-4 sm:p-5 hover:bg-surface-container-low/60 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Author, Language and Date */}
                        <div className="flex items-center gap-2 text-xs font-body text-secondary mb-1 flex-wrap">
                          <span className="font-semibold text-primary">
                            {article.author ? `By ${article.author}` : 'Editorial Desk'}
                          </span>
                          <span>•</span>
                          <span className="uppercase text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-surface-container text-on-surface border border-surface-container-high/60">
                            {article.original_language}
                          </span>
                          <span>•</span>
                          <span className="text-on-surface-variant">
                            {new Date(article.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="font-headline text-[18px] sm:text-[20px] leading-snug text-primary group-hover:text-secondary transition-colors font-medium">
                          {article.title}
                        </h4>

                        {/* Content Excerpt */}
                        <p className="font-body text-xs sm:text-sm leading-relaxed text-on-surface-variant mt-1.5 line-clamp-3 whitespace-pre-line">
                          {article.content}
                        </p>
                      </div>

                      {/* Similarity Score and Cosine Distance Pill */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border shadow-sm ${getScoreBadgeClass(
                            article.similarity_score
                          )}`}
                          title={`Similarity Score: ${article.similarity_score} | Cosine Distance: ${article.distance}`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{matchPercent}% Match</span>
                        </span>

                        <span className="text-[10px] font-mono text-secondary">
                          score: {article.similarity_score.toFixed(4)}
                        </span>
                        <span className="text-[10px] font-mono text-secondary">
                          dist: {article.distance.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })
            )}

            {!isLoading && !hasResults && (
              <div className="p-8 text-center text-sm font-body text-secondary">
                <p>No articles found exceeding similarity threshold for &ldquo;{query}&rdquo;.</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Try broader semantic terms such as &ldquo;y tế&rdquo;, &ldquo;technology&rdquo;, or &ldquo;energy&rdquo;.
                </p>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="px-5 py-2.5 bg-surface-container-low/50 border-t border-surface-container-high/60 flex items-center justify-between text-[11px] font-body text-secondary">
            <span>Press ESC or click outside to dismiss</span>
            <span className="text-primary font-medium">Pgvector Cosine Metric: 1.0 - distance</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SemanticSearchBar;
