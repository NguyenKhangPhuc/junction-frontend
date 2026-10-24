'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import {
  useArticles,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
} from '@/app/hooks/useArticles';
import { useDynamicModal } from '@/app/context/DynamicModalContext';
import { ArticleCreateRequest, ArticleResponse } from '@/app/types/api';

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
  const [editingArticle, setEditingArticle] = useState<ArticleResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
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
    data: articles,
    isLoading: isArticlesLoading,
    isError: isArticlesError,
    error: articlesError,
    refetch: refetchArticles,
  } = useArticles();
  console.log(articles)
  const createArticleMutation = useCreateArticle();
  const updateArticleMutation = useUpdateArticle();
  const deleteArticleMutation = useDeleteArticle();

  // Dynamic Modal Context
  const { openModal } = useDynamicModal();

  const isMutating =
    createArticleMutation.isPending ||
    updateArticleMutation.isPending ||
    deleteArticleMutation.isPending;

  // Form submission: Create or Update
  const onSubmit = async (data: ArticleCreateRequest) => {
    setSubmitError(null);
    setActionSuccessMessage(null);

    try {
      if (editingArticle) {
        const response = await updateArticleMutation.mutateAsync({
          id: editingArticle.id,
          data,
        });
        setCreatedArticle(response);
        setActionSuccessMessage(`Article #${editingArticle.id} was updated and re-vectorized.`);
        setEditingArticle(null);
      } else {
        const response = await createArticleMutation.mutateAsync(data);
        setCreatedArticle(response);
        setActionSuccessMessage(`Article #${response.id} was published with 1024-dim embedding.`);
      }

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

  // Start editing existing article
  const handleEditClick = (article: ArticleResponse) => {
    setEditingArticle(article);
    setCreatedArticle(null);
    setSubmitError(null);
    setActionSuccessMessage(null);

    setValue('title', article.title);
    setValue('author', article.author || '');
    setValue('original_language', article.original_language);
    setValue('content', article.content);

    // Smoothly scroll to authoring form
    document.getElementById('authoring-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Cancel edit mode and reset form
  const handleCancelEdit = () => {
    setEditingArticle(null);
    reset({
      title: '',
      author: '',
      original_language: 'vi',
      content: '',
    });
  };

  // Prompt delete confirmation modal
  const handleDeleteClick = (article: ArticleResponse) => {
    openModal({
      title: 'Delete Article Dispatch',
      message: (
        <div className="space-y-2">
          <p>
            Are you sure you want to delete article <span className="font-semibold text-primary">#{article.id} &ldquo;{article.title}&rdquo;</span>?
          </p>
          <p className="text-xs text-red-600">
            This action will permanently delete the dispatch and remove its 1024-dimensional semantic embedding from the database.
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
          if (editingArticle?.id === article.id) {
            handleCancelEdit();
          }
        } catch (err) {
          console.error('[CreateArticle] Failed to delete article:', err);
          throw err;
        }
      },
    });
  };

  return (
    <div className="w-full pt-16 md:pt-24 pb-space-xl bg-background text-on-surface">
      <div className="max-w-4xl mx-auto px-gutter-mobile lg:px-margin space-y-12">
        {/* Header Breadcrumb & Masthead Title */}
        <div className="border-b border-surface-container-high pb-6">
          <div className="flex items-center gap-2 text-xs font-body text-secondary uppercase tracking-widest mb-2">
            <span>Newsroom Desk</span>
            <span>•</span>
            <span className="text-primary font-semibold">Authoring Suite</span>
          </div>

          <h1 className="font-headline text-[32px] sm:text-[40px] leading-[38px] sm:leading-[48px] text-primary tracking-tight font-normal">
            {editingArticle ? `Edit Dispatch #${editingArticle.id}` : 'Publish Editorial Article'}
          </h1>

          <p className="font-body text-[14px] sm:text-[16px] leading-[22px] sm:leading-[26px] text-on-surface-variant mt-2 max-w-2xl">
            Draft, update, and manage dispatches across the Pohjola Post network. Submissions automatically generate 1024-dimensional semantic embeddings via <span className="font-mono text-primary font-semibold">intfloat/multilingual-e5-large</span> for cross-lingual discovery.
          </p>
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
                Check browser console or terminal logs for detailed stack trace.
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

        {/* Success Banner with Formatted Multi-line Preview */}
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
                    ✓ Vector embedding registered (pgvector 1024-dim)
                  </span>
                </div>
              </div>
            </div>

            {/* Preserved Multi-line Content Preview */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/60 max-h-60 overflow-y-auto">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-secondary mb-1">
                Content Preview (Line breaks preserved via whitespace-pre-line):
              </span>
              <p className="font-body text-xs sm:text-sm text-on-surface whitespace-pre-line leading-relaxed">
                {createdArticle.content}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-surface-container-high/60">
              <button
                type="button"
                onClick={() => setCreatedArticle(null)}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-body text-xs uppercase tracking-wider font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Create Another Article
              </button>

              <Link
                href="/#news"
                className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-body text-xs uppercase tracking-wider font-semibold transition-colors"
              >
                View News Wire →
              </Link>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
         * AUTHORING FORM CONTAINER
         * ------------------------------------------------------------*/ }
        <div id="authoring-form" className="bg-surface-container-lowest border border-surface-container-high/60 rounded-2xl p-6 sm:p-10 shadow-sm scroll-mt-28">
          {editingArticle && (
            <div className="mb-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between text-xs font-body">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>
                  Editing Article <strong>#{editingArticle.id}</strong>. Changes will update the record and regenerate vector embeddings.
                </span>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="font-semibold text-amber-800 hover:text-amber-950 underline cursor-pointer"
              >
                Cancel Edit
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title Field */}
            <div className="space-y-1.5">
              <label htmlFor="title" className="block font-body text-[13px] uppercase tracking-wider font-semibold text-primary">
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
                placeholder="e.g. Autonomous Fleet Navigation and Real-Time Telemetry in the Gulf of Bothnia"
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-surface-container-high font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-60"
              />
              {errors.title && (
                <p className="text-xs text-red-600 font-body mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Author and Language Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Author Field */}
              <div className="space-y-1.5">
                <label htmlFor="author" className="block font-body text-[13px] uppercase tracking-wider font-semibold text-primary">
                  Author / Byline
                </label>
                <input
                  id="author"
                  type="text"
                  disabled={isMutating}
                  {...register('author')}
                  placeholder="e.g. Pekka Virtanen or Dr. Nguyễn Minh Tuấn"
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-surface-container-high font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-60"
                />
                <span className="block text-[11px] font-body text-secondary">
                  Optional. Defaults to newsroom editorial staff.
                </span>
              </div>

              {/* Original Language Selector */}
              <div className="space-y-1.5">
                <label htmlFor="original_language" className="block font-body text-[13px] uppercase tracking-wider font-semibold text-primary">
                  Original Language <span className="text-red-600">*</span>
                </label>
                <select
                  id="original_language"
                  disabled={isMutating}
                  {...register('original_language', {
                    required: 'Language selection is required.',
                  })}
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-surface-container-high font-body text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-60 cursor-pointer"
                >
                  {languageOptions.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
                <span className="block text-[11px] font-body text-secondary">
                  E5 Model supports cross-lingual search across all selected languages.
                </span>
              </div>
            </div>

            {/* Content Textarea with Multi-line Formatting Support */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="content" className="block font-body text-[13px] uppercase tracking-wider font-semibold text-primary">
                  Article Body &amp; Content <span className="text-red-600">*</span>
                </label>
                <span className="text-[11px] font-body text-secondary">
                  {contentValue.length} characters • {paragraphCount} paragraph{paragraphCount !== 1 ? 's' : ''}
                </span>
              </div>

              <textarea
                id="content"
                rows={10}
                disabled={isMutating}
                {...register('content', {
                  required: 'Article content cannot be empty.',
                  minLength: {
                    value: 20,
                    message: 'Content must contain at least 20 characters.',
                  },
                })}
                placeholder={`Type or paste your article dispatch here. Press Enter to create new paragraphs.\n\nAll line breaks are stored in the database and rendered cleanly via whitespace-pre-line.`}
                className="w-full p-4 rounded-xl bg-surface-container-low border border-surface-container-high font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-y disabled:opacity-60 leading-relaxed whitespace-pre-wrap min-h-[240px]"
              />

              <div className="flex items-center justify-between text-[11px] font-body text-secondary">
                <span>
                  ✓ Pressing <kbd className="px-1 py-0.5 rounded bg-surface-container border text-[10px] font-mono">Enter</kbd> creates newlines (<code className="font-mono text-primary">\n</code>) preserved in database and front-end.
                </span>
                {errors.content && (
                  <span className="text-red-600 font-medium">
                    {errors.content.message}
                  </span>
                )}
              </div>
            </div>

            {/* Submission Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-surface-container-high/60">
              <div className="flex items-center gap-2 text-xs font-body text-secondary">
                <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                <span>Automatic 1024-dim embedding indexing</span>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                {editingArticle && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isMutating}
                    className="px-5 py-2.5 rounded-xl border border-surface-container-high hover:bg-surface-container font-body text-xs uppercase tracking-wider font-semibold text-secondary transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => reset()}
                  disabled={isMutating}
                  className="px-5 py-2.5 rounded-xl border border-surface-container-high hover:bg-surface-container font-body text-xs uppercase tracking-wider font-semibold text-on-surface transition-colors cursor-pointer disabled:opacity-50"
                >
                  Reset Form
                </button>

                <button
                  type="submit"
                  disabled={isMutating}
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-body text-xs uppercase tracking-wider font-semibold hover:bg-neutral-800 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isMutating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                      <span>{editingArticle ? 'Updating Dispatch...' : 'Embedding & Publishing...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{editingArticle ? 'Update Dispatch' : 'Publish Dispatch'}</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* -------------------------------------------------------------
         * SECTION: CREATED ARTICLES LIST (Cards with Edit & Delete)
         * ------------------------------------------------------------*/ }
        <section className="space-y-6 pt-4 border-t border-surface-container-high">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-body text-secondary uppercase tracking-widest mb-1">
                <span>Database Catalog</span>
                <span>•</span>
                <span className="text-primary font-semibold">Active Repository</span>
              </div>
              <h2 className="font-headline text-[26px] sm:text-[32px] text-primary tracking-tight font-normal">
                Published Editorial Dispatches
              </h2>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-1">
                Manage, edit, and inspect articles indexed in the pgvector semantic registry.
              </p>
            </div>

            <div className="self-start sm:self-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface font-body text-xs font-semibold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {articles?.length ?? 0} Dispatches Registered
              </span>
            </div>
          </div>

          {/* Loading Skeleton */}
          {isArticlesLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-high animate-pulse space-y-4">
                  <div className="h-4 bg-surface-container-high rounded w-1/3" />
                  <div className="h-6 bg-surface-container-high rounded w-4/5" />
                  <div className="h-16 bg-surface-container-high rounded w-full" />
                  <div className="h-8 bg-surface-container-high rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

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
                    <p className="font-mono text-[11px] text-amber-700 mt-1">
                      Verify that FastAPI is listening on port 5605 and refresh or retry.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => refetchArticles()}
                  className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-body text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer self-start sm:self-auto"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isArticlesLoading && !isArticlesError && (!articles || articles.length === 0) && (
            <div className="p-10 rounded-2xl bg-surface-container-lowest border border-dashed border-surface-container-high text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mx-auto text-secondary">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="font-headline text-[20px] text-primary font-medium">
                No Published Articles Found
              </h3>
              <p className="font-body text-xs sm:text-sm text-secondary max-w-md mx-auto">
                No articles are currently registered in the database. Use the authoring form above to publish your first dispatch.
              </p>
            </div>
          )}

          {/* Article Cards Grid */}
          {!isArticlesLoading && articles && articles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {articles.map((article) => (
                <article
                  key={article.id}
                  className={`p-6 rounded-2xl bg-surface-container-lowest border transition-all duration-200 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md ${editingArticle?.id === article.id
                      ? 'border-amber-400 ring-2 ring-amber-300'
                      : 'border-surface-container-high/60 hover:border-primary/40'
                    }`}
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
                      </div>

                      <span className="text-[11px] text-on-surface-variant">
                        {new Date(article.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Headline */}
                    <h3 className="font-headline text-[20px] leading-[26px] text-primary font-medium tracking-tight line-clamp-2">
                      {article.title}
                    </h3>

                    {/* Byline */}
                    <div className="text-xs font-body text-secondary">
                      By {article.author || 'Pohjola Editorial Staff'}
                    </div>

                    {/* Multi-line Content Snippet */}
                    <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/40 max-h-32 overflow-hidden">
                      <p className="font-body text-xs text-on-surface-variant whitespace-pre-line leading-relaxed line-clamp-3">
                        {article.content}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer: Status & Actions */}
                  <div className="pt-3 border-t border-surface-container-high/60 flex items-center justify-between gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-body text-emerald-700 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      1024-dim Vectorized
                    </span>

                    {/* Action Buttons: Edit & Delete */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(article)}
                        disabled={isMutating}
                        aria-label={`Edit article ${article.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-body text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span>Edit</span>
                      </button>

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

        {/* Editorial Architecture Note */}
        <div className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-high/60 text-secondary font-body text-xs leading-relaxed space-y-2">
          <p className="font-semibold text-primary uppercase tracking-wider">
            Semantic Embedding Pipeline Note
          </p>
          <p>
            When an article is created or updated via <code className="font-mono text-primary">POST /api/articles</code> or <code className="font-mono text-primary">PUT /api/articles/&#123;id&#125;</code>, the backend tokenizer feeds the complete multi-paragraph text to the <code className="font-mono text-primary">intfloat/multilingual-e5-large</code> encoder to generate a normalized 1024-dimensional dense vector. This vector is persisted to the pgvector column, allowing instant multilingual search via cosine similarity on the home page.
          </p>
        </div>
      </div>
    </div>
  );
}
