'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import {
  useArticles,
  useCreateArticle,
  useDeleteArticle,
} from '@/app/hooks/useArticles';
import { useDynamicModal } from '@/app/context/DynamicModalContext';
import { ArticleCreateRequest, ArticleResponse } from '@/app/types/api';
import { EditArticleModal } from '@/app/components/modal/EditArticleModal';
import { newsroomApi, ReviewQueueItem } from '@/app/services/api';

const languageOptions = [
  { value: 'fi', label: 'Suomi (Finnish Source)' },
  { value: 'en', label: 'English (International Oulu)' },
  { value: 'sv', label: 'Svenska (Swedish)' },
  { value: 'vi', label: 'Tiếng Việt (Vietnamese)' },
  { value: 'es', label: 'Español (Spanish)' },
  { value: 'de', label: 'Deutsch (German)' },
] as const;

export default function CreateArticlePage() {
  const [createdArticle, setCreatedArticle] = useState<ArticleResponse | null>(null);
  const [editingModalArticle, setEditingModalArticle] = useState<ArticleResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // HITL Editorial Queue State
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [isQueueLoading, setIsQueueLoading] = useState(false);
  const [isIngestingRss, setIsIngestingRss] = useState(false);
  const [editedScripts, setEditedScripts] = useState<Record<number, string>>({});
  const [rejectNotes, setRejectNotes] = useState<Record<number, string>>({});
  const [processingDubId, setProcessingDubId] = useState<number | null>(null);

  const fetchHitlQueue = useCallback(async () => {
    setIsQueueLoading(true);
    try {
      const data = await newsroomApi.getReviewQueue();
      setReviewQueue(data);
      const initialEdits: Record<number, string> = {};
      for (const item of data) {
        initialEdits[item.id] = item.transcript_text || '';
      }
      setEditedScripts((prev) => ({ ...initialEdits, ...prev }));
    } catch (err) {
      console.error('Failed to load HITL review queue:', err);
    } finally {
      setIsQueueLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHitlQueue();
  }, [fetchHitlQueue]);

  const handleIngestKalevaRss = async () => {
    setIsIngestingRss(true);
    setSubmitError(null);
    try {
      const res = await newsroomApi.ingestKaleva(4);
      setActionSuccessMessage(
        `Ingested ${res.ingested_count} live Kaleva RSS articles enriched with Oulu Open Data (api.ouka.fi) into the HITL Review Queue.`
      );
      await fetchHitlQueue();
      refetchArticles();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to ingest Kaleva RSS.');
    } finally {
      setIsIngestingRss(false);
    }
  };

  const handleApproveDraft = async (item: ReviewQueueItem) => {
    setProcessingDubId(item.id);
    setSubmitError(null);
    try {
      const editedText = editedScripts[item.id] ?? item.transcript_text;
      await newsroomApi.approveDraft(item.id, {
        edited_transcript_text: editedText,
        editor_name: 'Kaleva Duty Editor',
      });
      setActionSuccessMessage(
        `Approved Draft #${item.id} ("${item.headline_en || item.original_finnish_title}"). Edge-TTS narration & FFmpeg video rendering started!`
      );
      await fetchHitlQueue();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to approve draft.');
    } finally {
      setProcessingDubId(null);
    }
  };

  const handleRejectDraft = async (item: ReviewQueueItem) => {
    const note =
      rejectNotes[item.id]?.trim() ||
      'Requires additional municipal verification under JSN guidelines.';
    setProcessingDubId(item.id);
    setSubmitError(null);
    try {
      await newsroomApi.rejectDraft(item.id, {
        editor_notes: note,
        editor_name: 'Kaleva Duty Editor',
        return_to_draft: true,
      });
      setActionSuccessMessage(`Sent Draft #${item.id} back to draft state with editorial notes.`);
      await fetchHitlQueue();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to reject draft.');
    } finally {
      setProcessingDubId(null);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ArticleCreateRequest>({
    defaultValues: {
      title: '',
      author: 'Kaleva Oulu Desk',
      original_language: 'fi',
      content: '',
    },
  });

  const contentValue = watch('content') || '';
  const paragraphCount = contentValue.trim() ? contentValue.trim().split(/\n+/).length : 0;

  const {
    data: rawArticles,
    isLoading: isArticlesLoading,
    isError: isArticlesError,
    error: articlesError,
    refetch: refetchArticles,
  } = useArticles();

  const createArticleMutation = useCreateArticle();
  const deleteArticleMutation = useDeleteArticle();
  const { openModal } = useDynamicModal();

  const isMutating = createArticleMutation.isPending || deleteArticleMutation.isPending;

  // Filter out COMMUNITY_QUESTION rows so raw JSON metadata doesn't clutter the editorial catalog
  const articleList: ArticleResponse[] = useMemo(() => {
    let list: ArticleResponse[] = [];
    if (!rawArticles) return [];
    if (Array.isArray(rawArticles)) {
      list = rawArticles;
    } else if (typeof rawArticles === 'object' && rawArticles !== null) {
      const obj = rawArticles as Record<string, unknown>;
      if (Array.isArray(obj.data)) list = obj.data as ArticleResponse[];
      else if (Array.isArray(obj.articles)) list = obj.articles as ArticleResponse[];
      else if (Array.isArray(obj.results)) list = obj.results as ArticleResponse[];
    }
    return list.filter((a) => a.author !== 'COMMUNITY_QUESTION');
  }, [rawArticles]);

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

  const onSubmit = async (data: ArticleCreateRequest) => {
    setSubmitError(null);
    setActionSuccessMessage(null);
    try {
      const response = await createArticleMutation.mutateAsync(data);
      setCreatedArticle(response);
      setActionSuccessMessage(
        `Article #${response.id} published with 1024-dim cross-lingual embedding.`
      );
      reset({
        title: '',
        author: 'Kaleva Oulu Desk',
        original_language: 'fi',
        content: '',
      });
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit article.');
    }
  };

  const handleEditClick = (article: ArticleResponse) => {
    setEditingModalArticle(article);
  };

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
        </div>
      ),
      variant: 'danger',
      confirmText: 'Delete Dispatch',
      cancelText: 'Keep Dispatch',
      onConfirm: async () => {
        await deleteArticleMutation.mutateAsync(article.id);
        setActionSuccessMessage(`Article #${article.id} was deleted.`);
      },
    });
  };

  return (
    <div className="w-full pt-16 md:pt-24 pb-space-xl bg-background text-on-surface">
      <div className="max-w-7xl mx-auto px-gutter-mobile lg:px-gutter space-y-10">
        {/* Masthead */}
        <div className="border-b border-surface-container-high pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-body text-secondary uppercase tracking-widest mb-2">
              <span>Kaleva Media • OuluLens</span>
              <span>•</span>
              <span className="text-primary font-semibold">JSN Human-in-the-Loop Newsroom Desk</span>
            </div>

            <h1 className="font-headline text-[32px] sm:text-[40px] leading-[38px] sm:leading-[48px] text-primary tracking-tight font-normal">
              Editorial Review Gate &amp; Dispatch Studio
            </h1>

            <p className="font-body text-[14px] sm:text-[15px] leading-[22px] text-on-surface-variant mt-2 max-w-2xl">
              Ingest live Finnish reporting from Kaleva RSS, enrich with Oulu City Open Data (<span className="font-mono text-primary font-semibold">api.ouka.fi</span>), verify explanatory scripts under JSN Guidelines, and trigger Edge-TTS + FFmpeg video synthesis.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleIngestKalevaRss}
              disabled={isIngestingRss}
              className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-body text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {isIngestingRss ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Ingesting Kaleva RSS + Ouka API...</span>
                </>
              ) : (
                <span>⚡ Ingest Live Kaleva RSS + Oulu Open Data</span>
              )}
            </button>
            <a
              href="#hitl-queue"
              className="px-3.5 py-2.5 rounded-xl bg-primary text-on-primary font-body text-xs font-semibold uppercase tracking-wider"
            >
              🛡️ HITL Queue ({reviewQueue.length})
            </a>
          </div>
        </div>

        {/* Notifications */}
        {actionSuccessMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-sm flex items-center justify-between gap-3">
            <span className="font-body text-xs sm:text-sm font-medium">{actionSuccessMessage}</span>
            <button
              type="button"
              onClick={() => setActionSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs uppercase tracking-wider font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {submitError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-900 shadow-sm flex items-center justify-between gap-3">
            <span className="font-body text-xs sm:text-sm">{submitError}</span>
            <button
              type="button"
              onClick={() => setSubmitError(null)}
              className="text-red-700 text-xs uppercase font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* -------------------------------------------------------------
         * SECTION 1: JSN HUMAN-IN-THE-LOOP (HITL) EDITORIAL REVIEW QUEUE
         * ------------------------------------------------------------*/ }
        <section
          id="hitl-queue"
          className="p-6 sm:p-8 rounded-2xl bg-surface-container-lowest border-2 border-primary/20 shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container-high pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-800 font-bold">
                <span>Phase 2 Workflow</span>
                <span>•</span>
                <span>Mandatory Human Verification Before TTS Rendering</span>
              </div>
              <h2 className="font-headline text-[26px] text-primary mt-0.5">
                HITL Editorial Review Gate ({reviewQueue.length} Pending)
              </h2>
            </div>

            <button
              type="button"
              onClick={fetchHitlQueue}
              className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-body text-xs uppercase tracking-wider font-semibold cursor-pointer self-start"
            >
              ↻ Refresh Queue
            </button>
          </div>

          {isQueueLoading ? (
            <div className="p-8 text-center font-body text-xs text-secondary uppercase tracking-wider">
              Loading editorial review queue...
            </div>
          ) : reviewQueue.length === 0 ? (
            <div className="p-8 rounded-xl bg-surface-container-low border border-dashed border-surface-container-high text-center space-y-3">
              <p className="font-headline text-lg text-primary">
                No Drafts Waiting in the Editorial Queue
              </p>
              <p className="font-body text-xs text-secondary max-w-lg mx-auto">
                Click <strong>&ldquo;⚡ Ingest Live Kaleva RSS + Oulu Open Data&rdquo;</strong> above or upvote a community question on the front page to generate explanatory drafts for human verification.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviewQueue.map((item) => (
                <div
                  key={item.id}
                  className={`p-6 rounded-2xl border transition-all space-y-4 ${
                    item.status === 'flagged_for_review'
                      ? 'bg-amber-50/40 border-amber-400'
                      : item.high_stakes_warning
                      ? 'bg-red-50/20 border-red-300'
                      : 'bg-surface-container-low border-surface-container-high'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary text-on-primary">
                        Dub #{item.id}
                      </span>
                      <span className="font-mono text-xs uppercase font-semibold px-2.5 py-0.5 rounded bg-surface-container text-primary">
                        Status: {item.status}
                      </span>
                      {item.relevance_tag && (
                        <span className="font-body text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                          {item.relevance_tag}
                        </span>
                      )}
                      {item.kaleva_user_need && (
                        <span className="font-body text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900">
                          User Need: {item.kaleva_user_need}
                        </span>
                      )}
                      {item.high_stakes_warning && (
                        <span className="font-body text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300">
                          ⚠️ HIGH-STAKES TOPIC (Senior Editor Sign-Off Required)
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/videos/${item.video_id}`}
                      className="font-body text-xs font-semibold text-primary underline hover:no-underline"
                    >
                      Open Video Studio #{item.video_id} →
                    </Link>
                  </div>

                  {/* Community Flags Alert if pulled back */}
                  {item.community_flags && item.community_flags.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-950 text-xs font-body space-y-1">
                      <div className="font-bold uppercase tracking-wider">
                        ⚑ Community Fact/Nuance Flagged (JSN Pullback):
                      </div>
                      {item.community_flags.map((f, idx) => (
                        <div key={idx}>
                          <strong>{f.flagged_segment}:</strong> {f.correction_note} ({f.reporter || 'Community Member'})
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Two-column comparison: Original Finnish vs Editable English Explanatory Script */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <span className="font-mono text-[11px] uppercase font-bold text-secondary">
                        Original Finnish Source (Kaleva / Community)
                      </span>
                      <h3 className="font-headline text-lg text-primary font-medium">
                        {item.original_finnish_title}
                      </h3>
                      <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high text-xs font-body text-on-surface-variant max-h-48 overflow-y-auto whitespace-pre-line">
                        {item.original_finnish_text}
                      </div>

                      {/* Explainer Box Preview */}
                      {item.expat_explainer_box && item.expat_explainer_box.length > 0 && (
                        <div className="pt-2 space-y-1.5">
                          <span className="font-mono text-[11px] uppercase font-bold text-emerald-800">
                            Injected Cultural Context (&ldquo;What This Means For You&rdquo;):
                          </span>
                          {item.expat_explainer_box.map((exp, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-container-high text-xs font-body"
                            >
                              <strong className="text-primary">{exp.finnish_term}:</strong>{' '}
                              <span className="text-secondary">{exp.what_it_means_for_you}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] uppercase font-bold text-primary">
                          Editable English Narration Script (Pre-TTS Gate)
                        </span>
                        <span className="font-mono text-[11px] text-secondary">
                          Headline: {item.headline_en || 'N/A'}
                        </span>
                      </div>

                      <textarea
                        rows={6}
                        value={editedScripts[item.id] ?? item.transcript_text}
                        onChange={(e) =>
                          setEditedScripts((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        className="w-full p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high font-body text-xs sm:text-sm text-on-surface leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
                      />

                      {item.transcript_json?.journalist_verification_note && (
                        <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-950 text-xs font-body">
                          <strong>Journalist Verification Note:</strong>{' '}
                          {item.transcript_json.journalist_verification_note}
                        </div>
                      )}

                      {/* Reject Note Input + Approve / Reject Buttons */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                        <input
                          type="text"
                          value={rejectNotes[item.id] || ''}
                          onChange={(e) =>
                            setRejectNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          placeholder="Optional editorial note if rejecting..."
                          className="flex-1 h-10 px-3 rounded-xl bg-surface-container-lowest border border-surface-container-high text-xs font-body"
                        />

                        <button
                          type="button"
                          disabled={processingDubId === item.id}
                          onClick={() => handleRejectDraft(item)}
                          className="px-4 py-2.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-900 font-body text-xs uppercase tracking-wider font-semibold cursor-pointer disabled:opacity-50"
                        >
                          ✕ Reject / Return
                        </button>

                        <button
                          type="button"
                          disabled={processingDubId === item.id}
                          onClick={() => handleApproveDraft(item)}
                          className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-body text-xs uppercase tracking-wider font-semibold cursor-pointer disabled:opacity-50"
                        >
                          {processingDubId === item.id
                            ? 'Rendering...'
                            : '✓ Approve & Render Video'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* -------------------------------------------------------------
         * SECTION 2: MANUAL AUTHORING & PUBLISHED CATALOG
         * ------------------------------------------------------------*/ }
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: AUTHORING STUDIO */}
          <section
            id="authoring-desk"
            className="lg:col-span-5 bg-surface-container-lowest border border-surface-container-high/60 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6"
          >
            <div>
              <h2 className="font-headline text-[24px] text-primary font-normal tracking-tight">
                Manual Dispatch Studio
              </h2>
              <p className="font-body text-xs text-on-surface-variant mt-1">
                Compose a Finnish or English dispatch and attach video footage for dubbing.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="title" className="block font-body text-xs uppercase tracking-wider font-semibold text-primary">
                  Article Title <span className="text-red-600">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  disabled={isMutating}
                  {...register('title', { required: 'Article title is required.' })}
                  placeholder="e.g. Oulun talvikunnossapito ja pyöräbaanat"
                  className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-surface-container-high font-body text-sm text-on-surface"
                />
                {errors.title && <p className="text-xs text-red-600 font-body">{errors.title.message}</p>}
              </div>

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
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-surface-container-high font-body text-sm text-on-surface"
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
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-surface-container-high font-body text-sm text-on-surface cursor-pointer"
                  >
                    {languageOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="content" className="block font-body text-xs uppercase tracking-wider font-semibold text-primary">
                    Article Content <span className="text-red-600">*</span>
                  </label>
                  <span className="font-mono text-[11px] text-secondary">
                    {paragraphCount} paragraphs • {contentValue.length} chars
                  </span>
                </div>
                <textarea
                  id="content"
                  rows={6}
                  disabled={isMutating}
                  {...register('content', { required: 'Article content is required.' })}
                  placeholder="Paste Finnish municipal report or Kaleva article text..."
                  className="w-full p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high font-body text-sm text-on-surface leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isMutating}
                className="w-full h-12 rounded-xl bg-primary hover:bg-neutral-800 text-on-primary font-body text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer"
              >
                {createArticleMutation.isPending ? 'Vectorizing & Publishing...' : 'Publish Dispatch'}
              </button>
            </form>
          </section>

          {/* RIGHT COLUMN: PUBLISHED ARTICLES CATALOG */}
          <section id="catalog-section" className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-headline text-[26px] text-primary tracking-tight font-normal">
                  Ingested Kaleva &amp; Oulu Dispatches ({articleList.length})
                </h2>
                <button
                  type="button"
                  onClick={() => refetchArticles()}
                  className="px-3 py-1.5 rounded-lg bg-surface-container text-xs font-semibold cursor-pointer"
                >
                  Refresh
                </button>
              </div>

              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter dispatches by title, author, or language..."
                className="w-full h-10 px-4 rounded-xl bg-surface-container-low border border-surface-container-high font-body text-xs text-on-surface"
              />
            </div>

            {isArticlesError && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs">
                {articlesError instanceof Error ? articlesError.message : 'Network error'}
              </div>
            )}

            <div className="space-y-4">
              {filteredArticles.map((article) => (
                <article
                  key={article.id}
                  className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high/70 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs font-body text-secondary">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary px-1.5 py-0.5 rounded bg-surface-container">
                        #{article.id}
                      </span>
                      <span className="uppercase font-mono font-semibold px-2 py-0.5 rounded bg-surface-container">
                        {article.original_language}
                      </span>
                      <span>{article.author || 'Kaleva OuluLens'}</span>
                    </div>
                  </div>

                  <h3 className="font-headline text-[20px] text-primary font-medium">
                    {article.title}
                  </h3>

                  <p className="font-body text-xs text-on-surface-variant line-clamp-3">
                    {article.content}
                  </p>

                  <div className="pt-3 border-t border-surface-container-high/60 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditClick(article)}
                      className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-body text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    >
                      Attach Video / Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(article)}
                      className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-body text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      <EditArticleModal
        isOpen={Boolean(editingModalArticle)}
        article={editingModalArticle}
        onClose={() => setEditingModalArticle(null)}
        onSuccess={(updated) => {
          setActionSuccessMessage(`Article #${updated.id} was updated.`);
          refetchArticles();
        }}
      />
    </div>
  );
}