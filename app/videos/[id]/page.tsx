'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useVideoDetail } from '@/app/hooks/useVideos';
import { EmbedDubbingModal, DUBBING_LANGUAGES } from '@/app/components/modal/EmbedDubbingModal';
import { communityApi, ExpatExplainerItem } from '@/app/services/api';

interface SegmentItem {
  start: number;
  end: number;
  text: string;
}

function VideoTheaterContent() {
  const params = useParams();
  const videoId = Number(params?.id);

  const {
    data: video,
    isLoading,
    isError,
    error,
    refetch,
  } = useVideoDetail(videoId);

  const [userSelectedLanguage, setUserSelectedLanguage] = useState<string | null>(null);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);

  // Flag Error state (JSN Accountability)
  const [isFlagging, setIsFlagging] = useState(false);
  const [flagSegment, setFlagSegment] = useState('');
  const [flagNote, setFlagNote] = useState('');
  const [flagFeedback, setFlagFeedback] = useState<string | null>(null);

  const selectedLanguageCode = userSelectedLanguage ?? video?.original_language ?? '';

  const getLanguageName = (code: string) => {
    const found = DUBBING_LANGUAGES.find((l) => l.code.toLowerCase() === code.toLowerCase());
    return found ? found.name : code.toUpperCase();
  };

  // Normalize segments & OuluLens metadata whether transcript_json is an Array or an Object
  const availableVersions = useMemo(() => {
    if (!video) return [];

    const list: Array<{
      dubId?: number;
      code: string;
      label: string;
      path: string;
      isOriginal: boolean;
      status?: string;
      transcriptText?: string | null;
      segments: SegmentItem[];
      headlineEn?: string;
      relevanceTag?: string;
      kalevaUserNeed?: string;
      highStakesWarning?: boolean;
      aiDisclosure?: string;
      explainerBox: ExpatExplainerItem[];
    }> = [];

    const origSegments: SegmentItem[] = Array.isArray(video.original_transcript_json)
      ? video.original_transcript_json
      : [];

    // 1. Original video stream
    list.push({
      code: video.original_language,
      label: `Original Audio (${getLanguageName(video.original_language)} - ${video.original_language.toUpperCase()})`,
      path: video.file_path,
      isOriginal: true,
      transcriptText: video.original_transcript_text,
      segments: origSegments,
      explainerBox: [],
    });

    // 2. Dubbed video streams (including OuluLens explanatory digests)
    if (video.dubbed_versions && video.dubbed_versions.length > 0) {
      for (const dv of video.dubbed_versions) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawJson: any = dv.transcript_json;
        let segments: SegmentItem[] = [];
        let explainerBox: ExpatExplainerItem[] = [];
        let headlineEn: string | undefined;
        let relevanceTag: string | undefined;
        let kalevaUserNeed: string | undefined;
        let highStakesWarning = false;
        let aiDisclosure: string | undefined;

        if (Array.isArray(rawJson)) {
          segments = rawJson;
        } else if (rawJson && typeof rawJson === 'object') {
          if (Array.isArray(rawJson.spoken_narration_segments)) {
            segments = rawJson.spoken_narration_segments;
          } else if (Array.isArray(rawJson.segments)) {
            segments = rawJson.segments;
          }
          if (Array.isArray(rawJson.expat_explainer_box)) {
            explainerBox = rawJson.expat_explainer_box;
          }
          headlineEn = rawJson.headline_en;
          relevanceTag = rawJson.relevance_tag;
          kalevaUserNeed = rawJson.kaleva_user_need;
          highStakesWarning = Boolean(rawJson.high_stakes_warning);
          aiDisclosure = rawJson.ai_disclosure;
        }

        list.push({
          dubId: dv.id,
          code: dv.target_language,
          label: `Kaleva OuluLens Dub (${getLanguageName(dv.target_language)} - ${dv.target_language.toUpperCase()}) [${dv.status}]`,
          path: dv.dubbed_video_path || video.file_path,
          isOriginal: false,
          status: dv.status,
          transcriptText: dv.transcript_text,
          segments,
          headlineEn,
          relevanceTag,
          kalevaUserNeed,
          highStakesWarning,
          aiDisclosure,
          explainerBox,
        });
      }
    }

    return list;
  }, [video]);

  const activeVersion = useMemo(() => {
    if (availableVersions.length === 0) return null;
    if (!userSelectedLanguage) {
      const englishDub = availableVersions.find((v) => !v.isOriginal && v.code === 'en');
      if (englishDub) return englishDub;
    }
    const match = availableVersions.find((v) => v.code === selectedLanguageCode);
    return match || availableVersions[0];
  }, [availableVersions, selectedLanguageCode, userSelectedLanguage]);

  const activeVideoPlaybackUrl = useMemo(() => {
    if (!activeVersion?.path) return '';
    const path = activeVersion.path;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
      return path;
    }
    const apiHost =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5605';
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${apiHost}${cleanPath}`;
  }, [activeVersion]);

  const handleDubbingSuccess = (newLanguageCode: string) => {
    refetch();
    setUserSelectedLanguage(newLanguageCode);
  };

  const handleFlagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVersion?.dubId || !flagNote.trim()) return;
    try {
      await communityApi.flagVideoError(activeVersion.dubId, {
        flagged_segment: flagSegment.trim() || 'General Cultural / Factual Context',
        correction_note: flagNote.trim(),
        reporter_persona: 'Oulu International Resident',
      });
      setFlagFeedback(
        'JSN Accountability Triggered: This video has been pulled back to the Kaleva Editor Review Queue (status: flagged_for_review).'
      );
      setIsFlagging(false);
      setFlagSegment('');
      setFlagNote('');
      refetch();
    } catch (err) {
      console.error('Failed to flag video error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[70vh] flex items-center justify-center p-6 bg-background">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-body text-sm font-semibold text-primary uppercase tracking-wider">
            Loading Kaleva OuluLens Video Studio...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !video) {
    return (
      <div className="w-full max-w-2xl mx-auto py-24 px-6 text-center space-y-6">
        <h2 className="font-headline text-[26px] text-primary">Video Dispatch Not Found</h2>
        <p className="font-body text-sm text-secondary">
          {error instanceof Error ? error.message : `Unable to load video ID #${videoId}.`}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/create-article"
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-body text-xs uppercase tracking-wider font-semibold"
          >
            ← Return to Kaleva Newsroom Desk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pt-16 md:pt-24 pb-space-xl bg-background text-on-surface">
      <div className="max-w-6xl mx-auto px-gutter-mobile lg:px-gutter space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-surface-container-high">
          <div className="flex items-center gap-2 text-xs font-body text-secondary uppercase tracking-widest">
            <Link href="/" className="hover:text-primary transition-colors">
              Kaleva OuluLens
            </Link>
            <span>/</span>
            <Link href="/create-article" className="hover:text-primary transition-colors">
              HITL Newsroom Desk
            </Link>
            <span>/</span>
            <span className="text-primary font-semibold font-mono">Video #{video.id}</span>
          </div>

          <Link
            href="/create-article"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-body text-xs uppercase tracking-wider font-semibold transition-colors"
          >
            <span>← Back to Editorial Queue</span>
          </Link>
        </div>

        {/* Video Masthead & Badges */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-primary text-on-primary">
              KALEVA OULULENS
            </span>
            {activeVersion?.relevanceTag && (
              <span className="font-body text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                {activeVersion.relevanceTag}
              </span>
            )}
            {activeVersion?.kalevaUserNeed && (
              <span className="font-body text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900">
                User Need: {activeVersion.kalevaUserNeed}
              </span>
            )}
            {activeVersion?.highStakesWarning && (
              <span className="font-body text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300">
                ⚠️ High-Stakes Statutory Topic (JSN Verified)
              </span>
            )}
            {activeVersion?.status && (
              <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-surface-container text-secondary">
                Status: {activeVersion.status}
              </span>
            )}
          </div>

          <h1 className="font-headline text-[28px] sm:text-[38px] leading-[34px] sm:leading-[44px] text-primary font-normal tracking-tight">
            {activeVersion?.headlineEn || video.file_name}
          </h1>

          {/* JSN AI Disclosure Statement */}
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between gap-3 flex-wrap text-xs font-body text-secondary">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>
                {activeVersion?.aiDisclosure ||
                  'AI-assisted explanatory digest by Kaleva OuluLens, verified by a human journalist under JSN guidelines.'}
              </span>
            </div>
            {!activeVersion?.isOriginal && activeVersion?.dubId && (
              <button
                type="button"
                onClick={() => setIsFlagging(!isFlagging)}
                className="px-3 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-xs transition-colors cursor-pointer"
              >
                ⚑ Flag Cultural / Factual Error (JSN Pullback)
              </button>
            )}
          </div>
        </div>

        {/* Community Error Flagging Form */}
        {flagFeedback && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm font-body flex items-center justify-between">
            <span>{flagFeedback}</span>
            <button
              type="button"
              onClick={() => setFlagFeedback(null)}
              className="font-semibold underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {isFlagging && activeVersion?.dubId && (
          <form
            onSubmit={handleFlagSubmit}
            className="p-5 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-4"
          >
            <h3 className="font-headline text-lg text-primary">
              Report Factual or Cultural Nuance Error to Kaleva Desk
            </h3>
            <p className="font-body text-xs text-secondary">
              Under Finland&apos;s JSN Guidelines, community error reports immediately pull this dubbed asset back into the human editor review queue (<code className="font-mono">flagged_for_review</code>).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                value={flagSegment}
                onChange={(e) => setFlagSegment(e.target.value)}
                placeholder="Term or timestamp (e.g., 'Varhaiskasvatus 4-month rule')"
                className="h-10 px-3 rounded-xl bg-white border border-amber-300 text-xs font-body"
              />
              <input
                type="text"
                required
                value={flagNote}
                onChange={(e) => setFlagNote(e.target.value)}
                placeholder="What needs correction by a Kaleva journalist?"
                className="h-10 px-3 rounded-xl bg-white border border-amber-300 text-xs font-body"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-900 text-white font-body text-xs uppercase tracking-wider font-semibold cursor-pointer"
              >
                Submit Flag &amp; Pull to Editor Queue
              </button>
              <button
                type="button"
                onClick={() => setIsFlagging(false)}
                className="px-4 py-2 rounded-xl bg-surface-container text-primary font-body text-xs uppercase tracking-wider font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Language Switcher & Dubbing Trigger */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md space-y-1.5">
            <label
              htmlFor="language-audio-select"
              className="block font-body text-xs uppercase tracking-wider font-semibold text-primary"
            >
              Select Spoken / Explanatory Audio Track
            </label>
            <select
              id="language-audio-select"
              value={activeVersion?.code || selectedLanguageCode}
              onChange={(e) => setUserSelectedLanguage(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-surface-container-low border border-surface-container-high font-body text-sm text-on-surface font-medium cursor-pointer"
            >
              {availableVersions.map((version, i) => (
                <option key={`${version.code}-${i}`} value={version.code}>
                  {version.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 self-start md:self-end">
            <button
              type="button"
              onClick={() => setIsEmbedModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-primary hover:bg-neutral-800 text-on-primary font-body text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <span>Embed New Language Dub</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          </div>
        </div>

        {/* Video Player + Expat Cultural Explainer Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-surface-container-high shadow-2xl flex items-center justify-center">
              {activeVideoPlaybackUrl ? (
                <video
                  key={activeVideoPlaybackUrl}
                  src={activeVideoPlaybackUrl}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain"
                >
                  Your browser does not support HTML5 video playback.
                </video>
              ) : (
                <div className="text-center text-secondary text-sm font-body">
                  No playable media stream found.
                </div>
              )}
            </div>
          </div>

          {/* EXPAT EXPLAINER BOX ("What This Means For You in Oulu") */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-surface-container-lowest border-2 border-primary/20 shadow-sm space-y-4">
            <div className="border-b border-surface-container-high pb-3">
              <span className="font-mono text-[11px] uppercase font-bold text-emerald-700 tracking-wider">
                Explanatory Journalism Sidebar
              </span>
              <h3 className="font-headline text-[22px] text-primary mt-0.5">
                What This Means For You in Oulu
              </h3>
              <p className="font-body text-xs text-secondary mt-1">
                Bridging implicit Finnish municipal &amp; institutional terminology for international families.
              </p>
            </div>

            {activeVersion?.explainerBox && activeVersion.explainerBox.length > 0 ? (
              <div className="space-y-3">
                {activeVersion.explainerBox.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high space-y-1.5"
                  >
                    <div className="font-mono text-xs font-bold text-primary bg-amber-100/80 inline-block px-2 py-0.5 rounded">
                      {item.finnish_term}
                    </div>
                    <p className="font-body text-xs text-on-surface leading-relaxed">
                      {item.what_it_means_for_you}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface-container-low text-xs font-body text-secondary">
                Select an English OuluLens Explanatory track or approve this draft in the Newsroom HITL Queue to view Finnish institutional explainers (Wilma, Kela, Varhaiskasvatus, Talvikunnossapito).
              </div>
            )}
          </div>
        </div>

        {/* Time-Coded Transcript Section */}
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high/70 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-surface-container-high/60 pb-3">
            <h3 className="font-headline text-[20px] text-primary font-medium">
              Verified Spoken Narration &amp; Time-Coded Script
            </h3>
            <span className="text-[11px] font-mono uppercase font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface">
              Language: {(activeVersion?.code || selectedLanguageCode).toUpperCase()}
            </span>
          </div>

          {activeVersion?.segments && activeVersion.segments.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {activeVersion.segments.map((seg, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveSegmentIndex(idx)}
                  className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-start gap-3 ${
                    activeSegmentIndex === idx
                      ? 'bg-surface-container border-primary/40'
                      : 'bg-surface-container-low border-surface-container-high/40 hover:bg-surface-container/60'
                  }`}
                >
                  <span className="font-mono text-[11px] text-secondary font-semibold px-2 py-1 rounded bg-surface-container-lowest border border-surface-container-high flex-shrink-0">
                    {Number(seg.start || 0).toFixed(1)}s - {Number(seg.end || 0).toFixed(1)}s
                  </span>
                  <p className="font-body text-xs sm:text-sm text-on-surface leading-relaxed">
                    {seg.text}
                  </p>
                </div>
              ))}
            </div>
          ) : activeVersion?.transcriptText ? (
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high text-xs sm:text-sm font-body text-on-surface whitespace-pre-line leading-relaxed">
              {activeVersion.transcriptText}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-surface-container-low text-center text-xs font-body text-secondary">
              No speech transcript indexed for this track yet.
            </div>
          )}
        </div>
      </div>

      <EmbedDubbingModal
        isOpen={isEmbedModalOpen}
        onClose={() => setIsEmbedModalOpen(false)}
        video={video}
        onDubbingSuccess={handleDubbingSuccess}
      />
    </div>
  );
}

export default function VideoDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[70vh] flex items-center justify-center p-6 bg-background">
          <p className="font-body text-sm font-semibold text-primary uppercase tracking-wider">
            Loading Kaleva OuluLens Video Theater...
          </p>
        </div>
      }
    >
      <VideoTheaterContent />
    </Suspense>
  );
}