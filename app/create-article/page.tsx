'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  useArticles,
  useCreateArticle,
  useDeleteArticle,
} from '@/app/hooks/useArticles';
import { useDynamicModal } from '@/app/context/DynamicModalContext';
import { ArticleCreateRequest, ArticleResponse } from '@/app/types/api';
import { EditArticleModal } from '@/app/components/modal/EditArticleModal';

const languageOptions = [
  { value: 'vi', label: 'Tiếng Việt (Vietnamese)' },
  { value: 'en', label: 'English (Nordic / Global)' },
  { value: 'fi', label: 'Suomi (Finnish)' },
  { value: 'sv', label: 'Svenska (Swedish)' },
  { value: 'es', label: 'Español (Spanish)' },
  { value: 'de', label: 'Deutsch (German)' },
] as const;

export default function CreateArticlePage() {
  const [createdArticle, setCreatedArticle] = useState<ArticleResponse | null>(null);
  const [editingModalArticle, setEditingModalArticle] = useState<ArticleResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Form for creating new articles
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ArticleCreateRequest>({
    defaultValues: {
      title: '',
      author: '',
      original_language: 'vi',
      content: '',
    },
  });

  const contentValue = watch('content') || '';
  const paragraphCount = contentValue.trim() ? contentValue.trim().split(/\n+/).length : 0;

  // React Query Hooks
  const {
    data: rawArticles,
    isLoading: isArticlesLoading,
    isError: isArticlesError,
    error: articlesError,
    refetch: refetchArticles,
  } = useArticles();

  const createArticleMutation = useCreateArticle();
  const deleteArticleMutation = useDeleteArticle();

  // Dynamic Confirmation Modal Context (for deletion)
  const { openModal } = useDynamicModal();

  const isMutating =
    createArticleMutation.isPending ||
    deleteArticleMutation.isPending;

  // Robust normalization of articles list from API response
  const articleList: ArticleResponse[] = useMemo(() => {
    if (!rawArticles) return [];
    if (Array.isArray(rawArticles)) return rawArticles;
    if (typeof rawArticles === 'object' && rawArticles !== null) {
      const obj = rawArticles as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as ArticleResponse[];
      if (Array.isArray(obj.articles)) return obj.articles as ArticleResponse[];
      if (Array.isArray(obj.results)) return obj.results as ArticleResponse[];
      if (Array.isArray(obj.items)) return obj.items as ArticleResponse[];
      const vals = Object.values(obj).filter(
        (v): v is ArticleResponse => typeof v === 'object' && v !== null && 'title' in v
      );
      if (vals.length > 0) return vals;
    }
    return [];
  }, [rawArticles]);

  // Filtered articles based on search query
  const filteredArticles = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();
    if (!query) return articleList;
    return articleList.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        (a.author && a.author.toLowerCase().includes(query)) ||
        a.content.toLowerCase().includes(query) ||
        a.original_language.toLowerCase().includes(query) ||
        String(a.id).includes(query)
    );
  }, [articleList, searchFilter]);

  // Handle new article submission
  const onSubmit = async (data: ArticleCreateRequest) => {
    setSubmitError(null);
    setActionSuccessMessage(null);

    try {
      const response = await createArticleMutation.mutateAsync(data);
      setCreatedArticle(response);
      setActionSuccessMessage(
        `Article #${response.id} published with 1024-dim dense embedding.`
      );

      reset({
        title: '',
        author: '',
        original_language: 'vi',
        content: '',
      });
    } catch (err: unknown) {
      console.error('[CreateArticle] Submission error:', err);
      let errorMsg = 'Failed to submit article to the backend.';
      if (err instanceof Error) {
        errorMsg = err.message;
      }
      setSubmitError(errorMsg);
    }
  };

  // Open Edit Modal for an article
  const handleEditClick = (article: ArticleResponse) => {
    setEditingModalArticle(article);
  };

  // Prompt delete confirmation modal
  const handleDeleteClick = (article: ArticleResponse) => {
    openModal({
      title: 'Delete Article Dispatch',
      message: (
        <div className="space-y-2">
          <p>
            Are you sure you want to delete article{' '}
            <span className="font-semibold text-primary">
              #{article.id} &ldquo;{article.title}&rdquo;
            </span>
            ?
          </p>
          <p className="text-xs text-red-600">
            This action permanently removes the dispatch and purges its 1024-dimensional semantic embedding from the database.
          </p>
        </div>
      ),
      variant: 'danger',
      confirmText: 'Delete Dispatch',
      cancelText: 'Keep Dispatch',
      onConfirm: async () => {
        try {
          await deleteArticleMutation.mutateAsync(article.id);
          setActionSuccessMessage(`Article #${article.id} was successfully deleted.`);
        } catch (err) {
          console.error('[CreateArticle] Failed to delete article:', err);
          throw err;
        }
      },
    });
  };

  return (
    <div className="w-full pt-16 md:pt-24 pb-space-xl bg-background text-on-surface">
      <div className="max-w-7xl mx-auto px-gutter-mobile lg:px-gutter space-y-8">
        {/* Header Breadcrumb & Masthead Title */}
        <div className="border-b border-surface-container-high pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-body text-secondary uppercase tracking-widest mb-2">
              <span>Newsroom Desk</span>
              <span>•</span>
              <span className="text-primary font-semibold">Authoring &amp; Media Studio</span>
            </div>

            <h1 className="font-headline text-[32px] sm:text-[40px] leading-[38px] sm:leading-[48px] text-primary tracking-tight font-normal">
              Publish &amp; Manage Dispatches
            </h1>

            <p className="font-body text-[14px] sm:text-[15px] leading-[22px] text-on-surface-variant mt-2 max-w-2xl">
              Compose, edit, and link video media across the Pohjola Post registry. Dispatches automatically generate 1024-dimensional dense vectors via <span className="font-mono text-primary font-semibold">intfloat/multilingual-e5-large</span>.
            </p>
          </div>

          {/* Quick jump navigation pills for mobile / tablet */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="#authoring-desk"
              className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-primary font-body text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              ✍️ Authoring Studio
            </a>
            <a
              href="#catalog-section"
              className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-body text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>📰 Dispatches Catalog</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>({articleList.length})</span>
            </a>
          </div>
        </div>

        {/* Action Success Notification */}
        {actionSuccessMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-body text-xs sm:text-sm font-medium">
                {actionSuccessMessage}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActionSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs uppercase tracking-wider font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Alert Banner */}
        {submitError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-900 shadow-sm flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <span className="font-body text-xs font-semibold uppercase tracking-wider text-red-700 block">
                Backend API Error
              </span>
              <p className="font-body text-xs sm:text-sm mt-0.5">
                {submitError}
              </p>
              <p className="font-mono text-[11px] text-red-600/80 mt-1">
                Verify backend status at port 5605 and inspect terminal logs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubmitError(null)}
              className="text-red-700 hover:text-red-900 text-xs uppercase tracking-wider font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Recently Created Article Banner */}
        {createdArticle && (
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-emerald-300 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="flex-1">
                <span className="font-body text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                  Article Successfully Registered &amp; Vectorized
                </span>
                <h3 className="font-headline text-[22px] text-primary font-medium mt-0.5">
                  {createdArticle.title}
                </h3>
                <div className="flex items-center gap-2 mt-2 text-xs font-body text-secondary flex-wrap">
                  <span>ID: #{createdArticle.id}</span>
                  <span>•</span>
                  <span>Author: {createdArticle.author || 'Anonymous'}</span>
                  <span>•</span>
                  <span className="uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-surface-container text-on-surface">
                    {createdArticle.original_language}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-700 font-medium">
                    ✓ 1024-dim pgvector embedding saved
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-surface-container-high/60">
              <button
                type="button"
                onClick={() => setCreatedArticle(null)}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-body text-xs uppercase tracking-wider font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Create Another Article
              </button>

              <button
                type="button"
                onClick={() => handleEditClick(createdArticle)}
                className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-body text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
              >
                Attach Video / Edit →
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
         * MAIN RESPONSIVE WORKSPACE: 2-COLUMN SPLIT (Desktop)
         * ------------------------------------------------------------*/ }
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: AUTHORING STUDIO (Create New Article) */}
          <section
            id="authoring-desk"
            className="lg:col-span-5 bg-surface-container-lowest border border-surface-container-high/60 rounded-2xl p-6 sm:p-8 shadow-sm lg:sticky lg:top-24 space-y-6 scroll-mt-28"
          >
            <div>
              <div className="flex items-center gap-2 text-xs font-body text-secondary uppercase tracking-widest mb-1">
                <span>Compose</span>
                <span>•</span>
                <span className="text-primary font-semibold">New Dispatch</span>
              </div>
              <h2 className="font-headline text-[24px] text-primary font-normal tracking-tight">
                Authoring Studio
              </h2>
              <p className="font-body text-xs text-on-surface-variant mt-1">
                Draft a new article. Submissions automatically index into the pgvector vector space.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Title Field */}
              <div className="space-y-1.5">
                <label htmlFor="title" className="block font-body text-xs uppercase tracking-wider font-semibold text-primary">
                  Article Title <span className="text-red-600">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  disabled={isMutating}
                  {...register('title', {
                    required: 'Article title is required.',
                    minLength: {
                      value: 5,
                      message: 'Title must be at least 5 characters long.',
                    },
                  })}
                  placeholder="e.g. Autonomous Fleet Navigation and Real-Time Telemetry"
                  className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-surface-container-high font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-60"
                />
                {errors.title && (
                  <p className="text-xs text-red-600 font-body">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Author & Language Subgrid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="author" className="block font-body text-xs uppercase tracking-wider font-semibold text-primary">
                    Author / Byline
                  </label>
                  <input
                    id="author"
                    type="text"
                    disabled={isMutating}
                    {...register('author')}
                    placeholder="e.g. Pekka Virtanen"
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-surface-container-high font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="original_language" className="block font-body text-xs uppercase tracking-wider font-semibold text-primary">
                    Original Language
                  </label>
                  <select
                    id="original_language"
                    disabled={isMutating}
                    {...register('original_language')}
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-surface-container-high font-body text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {languageOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Content Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="content" className="block font-body text-xs uppercase tracking-wider font-semibold text-primary">
                    Article Content <span className="text-red-600">*</span>
                  </label>
                  <span className="font-mono text-[11px] text-secondary">
                    {paragraphCount} {paragraphCount === 1 ? 'paragraph' : 'paragraphs'} • {contentValue.length} chars
                  </span>
                </div>
                <textarea
                  id="content"
                  rows={8}
                  disabled={isMutating}
                  {...register('content', {
                    required: 'Article content is required.',
                    minLength: {
                      value: 20,
                      message: 'Content must be at least 20 characters long.',
                    },
                  })}
                  placeholder="Type multi-paragraph content here... Press Enter twice to create distinct editorial sections."
                  className="w-full p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-60 leading-relaxed"
                />
                {errors.content && (
                  <p className="text-xs text-red-600 font-body">
                    {errors.content.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isMutating}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-neutral-800 text-on-primary font-body text-xs uppercase tracking-wider font-semibold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {createArticleMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Vectorizing &amp; Publishing...</span>
                    </>
                  ) : (
                    <>
                      <span>Publish Editorial Article</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* RIGHT COLUMN: PUBLISHED ARTICLES CATALOG */}
          <section id="catalog-section" className="lg:col-span-7 space-y-6 scroll-mt-28">
            {/* Catalog Header & Search Controls */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-body text-secondary uppercase tracking-widest mb-1">
                    <span>Database Repository</span>
                    <span>•</span>
                    <span className="text-primary font-semibold">Live pgvector Catalog</span>
                  </div>
                  <h2 className="font-headline text-[26px] text-primary tracking-tight font-normal">
                    Published Dispatches
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface font-body text-xs font-semibold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    {articleList.length} Dispatches
                  </span>

                  <button
                    type="button"
                    onClick={() => refetchArticles()}
                    title="Refresh articles from backend"
                    className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-secondary hover:text-primary transition-colors cursor-pointer"
                  >
                    <svg className={`w-4 h-4 ${isArticlesLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Search / Filter Input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter published dispatches by title, author, or language..."
                  className="w-full h-10 pl-9 pr-4 rounded-xl bg-surface-container-low border border-surface-container-high font-body text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
                <svg className="w-4 h-4 text-secondary absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => setSearchFilter('')}
                    className="absolute right-3 top-2.5 text-xs text-secondary hover:text-primary font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Error Loading State */}
            {isArticlesError && (
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-2.5">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h4 className="font-body text-sm font-semibold uppercase tracking-wider text-amber-800">
                        Unable to Connect to Backend Database
                      </h4>
                      <p className="font-body text-xs sm:text-sm mt-0.5 text-amber-950">
                        {articlesError instanceof Error ? articlesError.message : 'Network error'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => refetchArticles()}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-body text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                  >
                    Retry Connection
                  </button>
                </div>
              </div>
            )}

            {/* Loading Skeletons (only when first loading and empty) */}
            {isArticlesLoading && articleList.length === 0 && (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high animate-pulse space-y-3">
                    <div className="h-4 bg-surface-container-high rounded w-1/4" />
                    <div className="h-6 bg-surface-container-high rounded w-3/4" />
                    <div className="h-16 bg-surface-container-high rounded w-full" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isArticlesLoading && !isArticlesError && filteredArticles.length === 0 && (
              <div className="p-10 rounded-2xl bg-surface-container-lowest border border-dashed border-surface-container-high text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mx-auto text-secondary">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="font-headline text-[20px] text-primary font-medium">
                  {searchFilter ? 'No Matching Dispatches' : 'No Published Articles Found'}
                </h3>
                <p className="font-body text-xs sm:text-sm text-secondary max-w-md mx-auto">
                  {searchFilter
                    ? `No articles match "${searchFilter}". Try adjusting your query.`
                    : 'No articles are currently registered in the database. Use the authoring studio to publish your first dispatch.'}
                </p>
              </div>
            )}

            {/* Article Cards List */}
            {filteredArticles.length > 0 && (
              <div className="space-y-4">
                {filteredArticles.map((article) => (
                  <article
                    key={article.id}
                    className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high/70 hover:border-primary/40 transition-all duration-200 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md"
                  >
                    <div className="space-y-3">
                      {/* Top Metadata Header */}
                      <div className="flex items-center justify-between text-xs font-body text-secondary gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-primary px-1.5 py-0.5 rounded bg-surface-container">
                            #{article.id}
                          </span>
                          <span className="uppercase font-mono font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface">
                            {article.original_language}
                          </span>
                          <span className="text-[11px] text-emerald-700 font-medium hidden sm:inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            1024-dim Vectorized
                          </span>
                        </div>

                        <span className="text-[11px] text-on-surface-variant font-mono">
                          {new Date(article.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Headline */}
                      <h3 className="font-headline text-[20px] leading-[26px] text-primary font-medium tracking-tight">
                        {article.title}
                      </h3>

                      {/* Byline */}
                      <div className="text-xs font-body text-secondary">
                        By {article.author || 'Pohjola Editorial Staff'}
                      </div>

                      {/* Content Snippet (line breaks preserved) */}
                      <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high/40 max-h-32 overflow-hidden">
                        <p className="font-body text-xs text-on-surface-variant whitespace-pre-line leading-relaxed line-clamp-3">
                          {article.content}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer: Actions */}
                    <div className="pt-3 border-t border-surface-container-high/60 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-[11px] font-body text-secondary">
                        <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Video &amp; Content editable</span>
                      </div>

                      {/* Action Buttons: Edit Modal & Delete */}
                      <div className="flex items-center gap-2">
                        {/* Edit Button: Opens EditArticleModal */}
                        <button
                          type="button"
                          onClick={() => handleEditClick(article)}
                          aria-label={`Edit article ${article.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-body text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <span>Edit &amp; Media</span>
                        </button>

                        {/* Delete Button: Opens DynamicPopupModal */}
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(article)}
                          disabled={isMutating}
                          aria-label={`Delete article ${article.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-body text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Editorial Architecture Note */}
        <div className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-high/60 text-secondary font-body text-xs leading-relaxed space-y-2">
          <p className="font-semibold text-primary uppercase tracking-wider">
            Semantic Embedding &amp; Multimodal Video Pipeline
          </p>
          <p>
            When an article is created or updated, the complete multi-paragraph text is vectorized via <code className="font-mono text-primary">intfloat/multilingual-e5-large</code> (1024 dimensions) into PostgreSQL. When video media is uploaded via the Edit Modal, <code className="font-mono text-primary">POST /api/videos</code> associates the media with the article, probes duration via FFmpeg, and prepares it for automated speech-to-text, translation, and TTS dubbing.
          </p>
        </div>
      </div>

      {/* Centered Popup Edit Modal with React Hook Form & Drag-and-Drop Video */}
      <EditArticleModal
        isOpen={Boolean(editingModalArticle)}
        article={editingModalArticle}
        onClose={() => setEditingModalArticle(null)}
        onSuccess={(updated) => {
          setActionSuccessMessage(`Article #${updated.id} was updated and re-vectorized.`);
          refetchArticles();
        }}
      />
    </div>
  );
}
