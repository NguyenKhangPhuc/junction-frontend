'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { SemanticSearchBar } from '@/app/components/search/SemanticSearchBar';
import {
  communityApi,
  CommunityQuestionItem,
  newsroomApi,
  ReviewQueueItem,
  videoApi,
} from '@/app/services/api';
import { VideoDetailResponse } from '@/app/types/api';

export default function HomePage() {
  const [videos, setVideos] = useState<VideoDetailResponse[]>([]);
  const [queueItems, setQueueItems] = useState<ReviewQueueItem[]>([]);
  const [questions, setQuestions] = useState<CommunityQuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Community Question Form
  const [newTitle, setNewTitle] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newPersona, setNewPersona] = useState('Oulu Tech Worker & Family');
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [activePitchId, setActivePitchId] = useState<number | null>(null);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [vids, queue, qs] = await Promise.all([
        videoApi.getAll().catch(() => []),
        newsroomApi.getReviewQueue().catch(() => []),
        communityApi.getQuestions().catch(() => []),
      ]);
      setVideos(Array.isArray(vids) ? vids : []);
      setQueueItems(Array.isArray(queue) ? queue : []);
      setQuestions(Array.isArray(qs) ? qs : []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSeedDemo = async () => {
    try {
      await communityApi.seedDemo();
      setBannerMessage('Seeded 3 Oulu Expat Community questions for the live demo!');
      await loadAll();
    } catch (err) {
      console.error('Seed demo error:', err);
    }
  };

  const handleIngestKaleva = async () => {
    try {
      setBannerMessage('Ingesting live Kaleva RSS feed + Oulu Open Data (api.ouka.fi)...');
      const res = await newsroomApi.ingestKaleva(3);
      setBannerMessage(
        `Ingested ${res.ingested_count} Kaleva Oulu articles into the HITL Editorial Queue!`
      );
      await loadAll();
    } catch (err) {
      console.error('Ingest error:', err);
    }
  };

  const handleUpvote = async (qId: number) => {
    try {
      const res = await communityApi.upvoteQuestion(qId);
      if (res.auto_drafted_for_editor) {
        setBannerMessage(
          `🔥 3 Upvotes Reached! Community Agent retrieved cross-lingual pgvector + Oulu Open Data (api.ouka.fi) context and drafted a 60s explanatory script in the HITL Editor Queue!`
        );
      } else {
        setBannerMessage(`Upvoted question #${qId} (${res.upvotes} upvotes).`);
      }
      await loadAll();
    } catch (err) {
      console.error('Upvote failed:', err);
    }
  };

  const handlePitchToKaleva = async (qId: number) => {
    try {
      setActivePitchId(qId);
      await communityApi.pitchToKaleva(qId);
      setBannerMessage(
        `Generated Finnish Reverse-Bridge story pitch for Kaleva's mainstream newsdesk!`
      );
      await loadAll();
    } catch (err) {
      console.error('Reverse-bridge pitch failed:', err);
    } finally {
      setActivePitchId(null);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newQuestionText.trim()) return;
    try {
      await communityApi.submitQuestion({
        title: newTitle.trim(),
        question_text: newQuestionText.trim(),
        persona_tag: newPersona,
        language: 'en',
      });
      setNewTitle('');
      setNewQuestionText('');
      setBannerMessage('Submitted community question! At 3 upvotes it auto-drafts an OuluLens video briefing.');
      await loadAll();
    } catch (err) {
      console.error('Failed to submit question:', err);
    }
  };

  return (
    <div className="w-full pt-16 md:pt-24 pb-space-xl bg-background text-on-surface">
      <div className="max-w-7xl mx-auto px-gutter-mobile lg:px-gutter space-y-12">
        {/* LIVE WIRE META BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-container-high pb-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-on-primary font-mono text-[11px] uppercase font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              KALEVA OULULENS
            </span>
            <span className="font-body text-xs text-secondary uppercase tracking-widest">
              Explanatory Journalism &amp; Two-Way Community Newsroom for International Oulu
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSeedDemo}
              className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-body text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              🌱 Seed Demo Q&amp;A
            </button>
            <button
              type="button"
              onClick={handleIngestKaleva}
              className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-body text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              ⚡ Pull Live Kaleva RSS
            </button>
            <Link
              href="/create-article"
              className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-body text-xs font-semibold uppercase tracking-wider"
            >
              🛡️ Editor HITL Queue ({queueItems.length})
            </Link>
          </div>
        </div>

        {/* Live Action Banner */}
        {bannerMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs sm:text-sm font-body flex items-center justify-between gap-4 shadow-sm">
            <span>{bannerMessage}</span>
            <button
              type="button"
              onClick={() => setBannerMessage(null)}
              className="font-semibold uppercase text-xs text-emerald-800 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* HERO MASTHEAD & CROSS-LINGUAL SEMANTIC SEARCH */}
        <div className="space-y-6 text-center max-w-4xl mx-auto">
          <h1 className="font-headline text-[36px] sm:text-[52px] leading-[42px] sm:leading-[58px] text-primary font-normal tracking-tight">
            Oulu Municipal Decisions, Explained for International Families.
          </h1>
          <p className="font-body text-sm sm:text-base text-on-surface-variant max-w-2xl mx-auto">
            Powered by Kaleva reporting, City of Oulu Open Data (<code className="font-mono text-primary">api.ouka.fi</code>), cross-lingual <code className="font-mono text-primary">pgvector</code> search, and mandatory human journalist verification under Finland&apos;s JSN Guidelines.
          </p>
          <div className="max-w-2xl mx-auto">
            <SemanticSearchBar />
          </div>
        </div>

        {/* -------------------------------------------------------------
         * SECTION 1: EXPLANATORY VIDEO & AUDIO DISPATCHES
         * ------------------------------------------------------------*/ }
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
            <div>
              <span className="font-mono text-xs uppercase text-secondary tracking-wider">
                Multilingual Broadcast &amp; Cultural Context
              </span>
              <h2 className="font-headline text-[28px] text-primary">
                Latest OuluLens Video Briefings
              </h2>
            </div>
            <Link
              href="/create-article"
              className="font-body text-xs font-semibold uppercase tracking-wider text-primary underline"
            >
              Manage in Newsroom Desk →
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 text-center font-body text-xs text-secondary uppercase">
              Loading OuluLens dispatches...
            </div>
          ) : videos.length === 0 ? (
            <div className="p-8 rounded-2xl bg-surface-container-lowest border border-dashed border-surface-container-high text-center space-y-3">
              <p className="font-headline text-lg text-primary">
                No Video Briefings Rendered Yet
              </p>
              <p className="font-body text-xs text-secondary">
                Click <strong>&ldquo;⚡ Pull Live Kaleva RSS&rdquo;</strong> above, then approve a draft in the <strong>Editor HITL Queue</strong> to render an English explanatory video.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((v) => {
                const latestDub = v.dubbed_versions?.[0];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const tJson: any = latestDub?.transcript_json || {};
                const headline = tJson.headline_en || v.file_name;
                const relevance = tJson.relevance_tag || 'Oulu Municipal Dispatch';
                const userNeed = tJson.kaleva_user_need || 'Understanding';
                const explainers = Array.isArray(tJson.expat_explainer_box)
                  ? tJson.expat_explainer_box
                  : [];

                return (
                  <Link
                    key={v.id}
                    href={`/videos/${v.id}`}
                    className="group p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high hover:border-primary transition-all shadow-sm hover:shadow-md flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-body text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                          {relevance}
                        </span>
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-container text-secondary">
                          Need: {userNeed}
                        </span>
                      </div>

                      <h3 className="font-headline text-[21px] leading-[27px] text-primary group-hover:underline">
                        {headline}
                      </h3>

                      {latestDub?.transcript_text && (
                        <p className="font-body text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
                          {latestDub.transcript_text}
                        </p>
                      )}

                      {explainers.length > 0 && (
                        <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high text-xs font-body space-y-1">
                          <span className="font-mono text-[10px] uppercase font-bold text-emerald-800 block">
                            Explained Term: {explainers[0].finnish_term}
                          </span>
                          <p className="text-[11px] text-secondary line-clamp-2">
                            {explainers[0].what_it_means_for_you}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-surface-container-high/60 flex items-center justify-between text-xs font-body font-semibold text-primary">
                      <span>▶ Watch Explanatory Video</span>
                      <span className="font-mono text-[11px] text-secondary uppercase">
                        {latestDub?.status || 'Ready'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* -------------------------------------------------------------
         * SECTION 2: TWO-WAY COMMUNITY TOUCHPOINT & REVERSE-BRIDGE
         * ------------------------------------------------------------*/ }
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
          {/* Left: Ask a Question */}
          <div className="lg:col-span-4 p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-4">
            <span className="font-mono text-xs uppercase font-bold text-emerald-800">
              Phase 3 • Two-Way Community Loop
            </span>
            <h2 className="font-headline text-[24px] text-primary">
              Ask the Kaleva OuluLens Desk
            </h2>
            <p className="font-body text-xs text-secondary leading-relaxed">
              Have a question about daycare (<code className="font-mono">Varhaiskasvatus</code>), school messages (<code className="font-mono">Wilma</code>), winter cycling (<code className="font-mono">Talvikunnossapito</code>), or <code className="font-mono">Kela</code>? At <strong>3 community upvotes</strong>, our agent retrieves Oulu municipal data and drafts an audio/video answer for editor verification.
            </p>

            <form onSubmit={handleSubmitQuestion} className="space-y-3 pt-2">
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Short question headline..."
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container-high text-xs font-body"
              />
              <select
                value={newPersona}
                onChange={(e) => setNewPersona(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container-high text-xs font-body"
              >
                <option value="Oulu Tech Worker & Family">Persona: Oulu Tech Worker &amp; Family</option>
                <option value="Nokia Engineer & Parent">Persona: Nokia Engineer &amp; Parent</option>
                <option value="University of Oulu Researcher">Persona: University of Oulu Researcher</option>
              </select>
              <textarea
                rows={4}
                required
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Describe the everyday Oulu issue you want Kaleva journalists to explain..."
                className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container-high text-xs font-body"
              />
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-primary text-on-primary font-body text-xs uppercase tracking-wider font-semibold cursor-pointer"
              >
                Submit Question to Community Vote
              </button>
            </form>
          </div>

          {/* Right: Community Voting & Reverse-Bridge to Finnish Newsdesk */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs uppercase text-secondary">
                  Community-Driven Agenda Setting
                </span>
                <h2 className="font-headline text-[26px] text-primary">
                  Upvoted International Oulu Questions ({questions.length})
                </h2>
              </div>
              {questions.length === 0 && (
                <button
                  type="button"
                  onClick={handleSeedDemo}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  🌱 Seed 3 Demo Questions
                </button>
              )}
            </div>

            {questions.map((q) => (
              <div
                key={q.id}
                className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-surface-container text-primary">
                        👤 {q.persona_tag}
                      </span>
                      <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-900">
                        Status: {q.status}
                      </span>
                    </div>
                    <h3 className="font-headline text-[20px] text-primary font-medium">
                      {q.title}
                    </h3>
                    <p className="font-body text-xs sm:text-sm text-on-surface-variant">
                      {q.question_text}
                    </p>
                  </div>

                  {/* Upvote Counter Button */}
                  <button
                    type="button"
                    onClick={() => handleUpvote(q.id)}
                    className="px-4 py-2.5 rounded-xl bg-primary hover:bg-neutral-800 text-on-primary font-mono text-xs font-bold flex flex-col items-center justify-center min-w-[80px] cursor-pointer flex-shrink-0"
                  >
                    <span>▲ {q.upvotes}</span>
                    <span className="text-[10px] font-normal uppercase">Upvote</span>
                  </button>
                </div>

                {/* Auto-Drafted English Briefing Preview */}
                {q.ai_draft && (
                  <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high space-y-1.5 text-xs font-body">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold uppercase text-emerald-800">
                        ✓ Auto-Drafted for HITL Editor Queue (User Need: {q.ai_draft.kaleva_user_need || 'Usefulness'})
                      </span>
                      <Link href="/create-article#hitl-queue" className="text-primary font-semibold underline">
                        Review in HITL Gate →
                      </Link>
                    </div>
                    <p className="text-on-surface font-medium">{q.ai_draft.headline_en}</p>
                    <p className="text-secondary">{q.ai_draft.draft_answer_script}</p>
                  </div>
                )}

                {/* Reverse-Bridge Pitch to Mainstream Finnish Newsdesk */}
                {q.finnish_newsdesk_pitch && (
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2 text-xs font-body text-blue-950">
                    <div className="font-mono text-[11px] font-bold uppercase text-blue-900">
                      🇫🇮 Reverse-Bridge Pitch for Kaleva Mainstream Finnish Newsdesk:
                    </div>
                    <p className="font-headline text-base text-primary">
                      Otsikko: {q.finnish_newsdesk_pitch.otsikko_fi}
                    </p>
                    <p>{q.finnish_newsdesk_pitch.juttuidea_fi}</p>
                    {Array.isArray(q.finnish_newsdesk_pitch.haastateltavat_ehdotus) && (
                      <div>
                        <strong>Haastateltavat:</strong>{' '}
                        {q.finnish_newsdesk_pitch.haastateltavat_ehdotus.join(' • ')}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-surface-container-high/60">
                  <span className="font-mono text-[11px] text-secondary">
                    {q.upvotes < 3
                      ? `${3 - q.upvotes} more upvote(s) needed to trigger AI + Ouka Open Data draft`
                      : 'Threshold reached (≥3 upvotes) — Sent to Editor Queue'}
                  </span>

                  <button
                    type="button"
                    disabled={activePitchId === q.id}
                    onClick={() => handlePitchToKaleva(q.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-body text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  >
                    {activePitchId === q.id
                      ? 'Generating Finnish Pitch...'
                      : '🇫🇮 Pitch to Finnish Newsdesk (Reverse-Bridge)'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}