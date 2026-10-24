'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useVideoDetail } from '@/app/hooks/useVideos';
import { EmbedDubbingModal, DUBBING_LANGUAGES } from '@/app/components/modal/EmbedDubbingModal';

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

  // Derived selected language code: user choice or default original language
  const selectedLanguageCode = userSelectedLanguage ?? video?.original_language ?? '';

  // Helper to resolve language display name
  const getLanguageName = (code: string) => {
    const found = DUBBING_LANGUAGES.find((l) => l.code.toLowerCase() === code.toLowerCase());
    return found ? found.name : code.toUpperCase();
  };

  // Build the list of all playable video versions (Original + all dubbed versions)
  const availableVersions = useMemo(() => {
    if (!video) return [];

    const list: Array<{
      code: string;
      label: string;
      path: string;
      isOriginal: boolean;
      status?: string;
      transcriptText?: string | null;
      transcriptJson?: Array<{ start: number; end: number; text: string }> | null;
    }> = [];

    // 1. Original video stream
    list.push({
      code: video.original_language,
      label: `Original Audio (${getLanguageName(video.original_language)} - ${video.original_language.toUpperCase()})`,
      path: video.file_path,
      isOriginal: true,
      transcriptText: video.original_transcript_text,
      transcriptJson: video.original_transcript_json,
    });

    // 2. Dubbed video streams
    if (video.dubbed_versions && video.dubbed_versions.length > 0) {
      for (const dv of video.dubbed_versions) {
        if (dv.dubbed_video_path || dv.status === 'completed') {
          list.push({
            code: dv.target_language,
            label: `Dubbed Stream (${getLanguageName(dv.target_language)} - ${dv.target_language.toUpperCase()})`,
            path: dv.dubbed_video_path || video.file_path,
            isOriginal: false,
            status: dv.status,
            transcriptText: dv.transcript_text,
            transcriptJson: dv.transcript_json,
          });
        }
      }
    }

    return list;
  }, [video]);

  // Active version object
  const activeVersion = useMemo(() => {
    if (availableVersions.length === 0) return null;
    const match = availableVersions.find((v) => v.code === selectedLanguageCode);
    return match || availableVersions[0];
  }, [availableVersions, selectedLanguageCode]);

  // Construct absolute streaming URL for HTML5 player
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

  // Handle successful dubbing completion from modal
  const handleDubbingSuccess = (newLanguageCode: string) => {
    refetch();
    setUserSelectedLanguage(newLanguageCode);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full min-h-[70vh] flex items-center justify-center p-6 bg-background">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-body text-sm font-semibold text-primary uppercase tracking-wider">
            Loading Video Media &amp; Dubbed Versions...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !video) {
    return (
      <div className="w-full max-w-2xl mx-auto py-24 px-6 text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="font-headline text-[26px] text-primary">
            Video Dispatch Not Found
          </h2>
          <p className="font-body text-sm text-secondary">
            {error instanceof Error ? error.message : `Unable to load video ID #${videoId}.`}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/create-article"
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-body text-xs uppercase tracking-wider font-semibold"
          >
            ← Return to Authoring Suite
          </Link>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-5 py-2.5 rounded-xl bg-surface-container text-primary font-body text-xs uppercase tracking-wider font-semibold cursor-pointer"
          >
            Retry
          </button>
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
            <Link href="/create-article" className="hover:text-primary transition-colors">
              Newsroom Desk
            </Link>
            <span>/</span>
            <span>Video Theater Studio</span>
            <span>/</span>
            <span className="text-primary font-semibold font-mono">#{video.id}</span>
          </div>

          <Link
            href="/create-article"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-body text-xs uppercase tracking-wider font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Dispatches</span>
          </Link>
        </div>

        {/* Video Masthead & Headline */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-container text-primary">
              Video #{video.id}
            </span>
            <span className="font-mono text-xs uppercase font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface">
              Original: {video.original_language}
            </span>
            {video.duration && (
              <span className="font-mono text-xs text-secondary">
                Duration: {video.duration.toFixed(1)}s
              </span>
            )}
            {video.article_id && (
              <span className="text-xs font-body text-secondary">
                • Attached to Article #{video.article_id}
              </span>
            )}
          </div>

          <h1 className="font-headline text-[28px] sm:text-[38px] leading-[34px] sm:leading-[44px] text-primary font-normal tracking-tight">
            {video.file_name}
          </h1>

          <p className="font-body text-xs sm:text-sm text-on-surface-variant max-w-3xl">
            Watch and switch between AI-dubbed audio tracks. Embed new translations across 25+ supported languages powered by dual-engine neural speech synthesis (Coqui XTTS-v2 &amp; Microsoft Edge-TTS).
          </p>
        </div>

        {/* -------------------------------------------------------------
         * CONTROLS BAR: Language Switcher Select & Embed Dubbing Action
         * ------------------------------------------------------------*/ }
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Language Switcher Select Input */}
          <div className="flex-1 max-w-md space-y-1.5">
            <label
              htmlFor="language-audio-select"
              className="block font-body text-xs uppercase tracking-wider font-semibold text-primary"
            >
              Select Spoken / Dubbed Language Audio Track
            </label>
            <div className="relative">
              <select
                id="language-audio-select"
                value={selectedLanguageCode}
                onChange={(e) => setUserSelectedLanguage(e.target.value)}
                className="w-full h-11 pl-4 pr-10 rounded-xl bg-surface-container-low border border-surface-container-high font-body text-sm text-on-surface font-medium focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer shadow-sm appearance-none"
              >
                {availableVersions.map((version) => (
                  <option key={version.code} value={version.code}>
                    {version.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-secondary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <span className="block text-[11px] font-body text-secondary">
              Currently playing: <strong className="text-primary">{activeVersion?.label}</strong>
            </span>
          </div>

          {/* Action: Embed AI Dubbing Button */}
          <div className="flex items-center gap-3 self-start md:self-end">
            <button
              type="button"
              onClick={() => setIsEmbedModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-primary hover:bg-neutral-800 text-on-primary font-body text-xs uppercase tracking-wider font-semibold transition-all duration-150 flex items-center gap-2.5 cursor-pointer shadow-sm hover:shadow"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
              <span>Embed AI Dubbing</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          </div>
        </div>

        {/* -------------------------------------------------------------
         * PRIMARY THEATER VIDEO PLAYER
         * ------------------------------------------------------------*/ }
        <div className="space-y-4">
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

          {/* Video Player Information Bar */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between gap-4 text-xs font-body text-secondary flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-semibold text-primary">Active Media Stream:</span>
              <span className="font-mono truncate max-w-md">{activeVersion?.path || video.file_path}</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface">
                {activeVersion?.isOriginal ? 'Original Footage' : 'AI-Dubbed Synthesis'}
              </span>
              <span>Available Languages: {availableVersions.length}</span>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------
         * TRANSCRIPT & SUBTITLES SECTION
         * ------------------------------------------------------------*/ }
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high/70 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-surface-container-high/60 pb-3">
            <h3 className="font-headline text-[20px] text-primary font-medium flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <span>Time-Coded Speech Transcript &amp; Dialogue</span>
            </h3>

            <span className="text-[11px] font-mono uppercase font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface">
              Language: {selectedLanguageCode.toUpperCase()}
            </span>
          </div>

          {/* Transcript Content Display */}
          {activeVersion?.transcriptJson && activeVersion.transcriptJson.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {activeVersion.transcriptJson.map((seg, idx) => (
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
                    {seg.start.toFixed(1)}s - {seg.end.toFixed(1)}s
                  </span>
                  <p className="font-body text-xs sm:text-sm text-on-surface leading-relaxed">
                    {seg.text}
                  </p>
                </div>
              ))}
            </div>
          ) : activeVersion?.transcriptText ? (
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high text-xs sm:text-sm font-body text-on-surface whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
              {activeVersion.transcriptText}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-surface-container-low border border-dashed border-surface-container-high text-center text-xs font-body text-secondary space-y-1">
              <p>No speech transcript indexed for this track yet.</p>
              <p className="text-[11px]">
                Click <strong className="text-primary font-semibold">&ldquo;Embed AI Dubbing&rdquo;</strong> above to transcribe speech via Whisper and generate multilingual translations.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Embed AI Dubbing Modal */}
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
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-body text-sm font-semibold text-primary uppercase tracking-wider">
              Loading Video Theater...
            </p>
          </div>
        </div>
      }
    >
      <VideoTheaterContent />
    </Suspense>
  );
}
