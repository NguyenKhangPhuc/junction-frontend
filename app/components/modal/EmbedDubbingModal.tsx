'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProcessDubbingStream } from '@/app/hooks/useVideos';
import { VideoDetailResponse } from '@/app/types/api';

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  engine: 'xtts' | 'edge';
  supportsVoiceCloning: boolean;
}

export const DUBBING_LANGUAGES: SupportedLanguage[] = [
  // XTTS-v2 Voice Cloning Languages
  { code: 'en', name: 'English', nativeName: 'English (US/UK)', engine: 'xtts', supportsVoiceCloning: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', engine: 'xtts', supportsVoiceCloning: true },
  { code: 'fr', name: 'French', nativeName: 'Français', engine: 'xtts', supportsVoiceCloning: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', engine: 'xtts', supportsVoiceCloning: true },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', engine: 'xtts', supportsVoiceCloning: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', engine: 'xtts', supportsVoiceCloning: true },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', engine: 'xtts', supportsVoiceCloning: true },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', engine: 'xtts', supportsVoiceCloning: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', engine: 'xtts', supportsVoiceCloning: true },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', engine: 'xtts', supportsVoiceCloning: true },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', engine: 'xtts', supportsVoiceCloning: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', engine: 'xtts', supportsVoiceCloning: true },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', engine: 'xtts', supportsVoiceCloning: true },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', engine: 'xtts', supportsVoiceCloning: true },
  { code: 'ko', name: 'Korean', nativeName: '한국어', engine: 'xtts', supportsVoiceCloning: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', engine: 'xtts', supportsVoiceCloning: true },

  // Edge-TTS Standard Neural Languages (No Voice Cloning)
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', engine: 'edge', supportsVoiceCloning: false },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', engine: 'edge', supportsVoiceCloning: false },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', engine: 'edge', supportsVoiceCloning: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文 (Mandarin)', engine: 'edge', supportsVoiceCloning: false },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', engine: 'edge', supportsVoiceCloning: false },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', engine: 'edge', supportsVoiceCloning: false },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', engine: 'edge', supportsVoiceCloning: false },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', engine: 'edge', supportsVoiceCloning: false },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', engine: 'edge', supportsVoiceCloning: false },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', engine: 'edge', supportsVoiceCloning: false },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', engine: 'edge', supportsVoiceCloning: false },
];

export interface EmbedDubbingModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoDetailResponse;
  onDubbingSuccess?: (newLanguage: string) => void;
}

export function EmbedDubbingModal({
  isOpen,
  onClose,
  video,
  onDubbingSuccess,
}: EmbedDubbingModalProps) {
  // Set of languages already dubbed for this video
  const alreadyDubbedCodes = useMemo(() => {
    return new Set(
      (video.dubbed_versions || [])
        .filter((dv) => dv.status === 'completed' || dv.dubbed_video_path)
        .map((dv) => dv.target_language.toLowerCase())
    );
  }, [video.dubbed_versions]);

  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>(() => {
    const candidate = DUBBING_LANGUAGES.find(
      (l) => l.code !== video.original_language && !(video.dubbed_versions || []).some((dv) => dv.target_language.toLowerCase() === l.code.toLowerCase())
    );
    return candidate ? candidate.code : 'en';
  });
  const [engineMode, setEngineMode] = useState<'edge' | 'xtts'>('edge');
  const [searchQuery, setSearchQuery] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentStageText, setCurrentStageText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const processDubbingStreamMutation = useProcessDubbingStream();

  // Find currently selected language object
  const selectedLanguage = DUBBING_LANGUAGES.find((l) => l.code === selectedLanguageCode) || DUBBING_LANGUAGES[0];

  // Filtered language list
  const filteredLanguages: SupportedLanguage[] = useMemo(() => {
    return DUBBING_LANGUAGES.filter(
      (lang: SupportedLanguage) =>
        lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Group languages by cloning support
  const xttsLanguages: SupportedLanguage[] = useMemo(
    () => filteredLanguages.filter((l: SupportedLanguage) => l.supportsVoiceCloning),
    [filteredLanguages]
  );
  const edgeLanguages: SupportedLanguage[] = useMemo(
    () => filteredLanguages.filter((l: SupportedLanguage) => !l.supportsVoiceCloning),
    [filteredLanguages]
  );

  const handleClose = useCallback(() => {
    if (processDubbingStreamMutation.isPending) {
      if (abortController) {
        abortController.abort();
      }
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setProgressPercent(0);
    setCurrentStageText('');
    setAbortController(null);
    onClose();
  }, [processDubbingStreamMutation.isPending, abortController, onClose]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !processDubbingStreamMutation.isPending) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, processDubbingStreamMutation.isPending, handleClose]);

  // Handle starting the dubbing pipeline with real-time streaming
  const handleStartDubbing = async () => {
    if (!video.file_path) {
      setErrorMessage('Video file path is missing.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setProgressPercent(5);
    setCurrentStageText('Connecting to real-time dubbing pipeline...');

    const controller = new AbortController();
    setAbortController(controller);

    const activeEngine = selectedLanguage.supportsVoiceCloning && engineMode === 'xtts' ? 'xtts' : 'edge';

    try {
      await processDubbingStreamMutation.mutateAsync({
        payload: {
          video_path: video.file_path,
          target_language: selectedLanguage.code,
          article_id: video.article_id || undefined,
          tts_engine: activeEngine,
        },
        signal: controller.signal,
        onProgress: (event) => {
          if (typeof event.percent === 'number') {
            setProgressPercent(event.percent);
          }
          if (event.message) {
            setCurrentStageText(event.message);
          }
        },
      });

      setProgressPercent(100);
      setCurrentStageText('Dubbing completed! Media stream is ready.');
      setSuccessMessage(
        `Successfully generated ${selectedLanguage.name} (${selectedLanguage.code.toUpperCase()}) dubbed video stream!`
      );

      if (onDubbingSuccess) {
        onDubbingSuccess(selectedLanguage.code);
      }
    } catch (err: unknown) {
      setProgressPercent(0);
      setCurrentStageText('');
      console.error('[EmbedDubbingModal] Pipeline error:', err);
      let errorMsg = 'Failed to execute dubbing pipeline.';
      if (err instanceof Error) {
        errorMsg = err.message;
      }
      setErrorMessage(errorMsg);
    } finally {
      setAbortController(null);
    }
  };

  const isPending = processDubbingStreamMutation.isPending;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="embed-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          {/* Blurred Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !isPending && handleClose()}
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity cursor-pointer"
          />

          {/* Centered Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-2xl bg-surface-container-lowest border border-surface-container-high rounded-2xl shadow-2xl z-10 flex flex-col my-auto max-h-[92vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-surface-container-high flex items-center justify-between gap-4 bg-surface-container-lowest/80 backdrop-blur-sm sticky top-0 z-20">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-[11px] font-body text-secondary uppercase tracking-widest">
                  <span className="font-mono font-bold text-primary px-1.5 py-0.5 rounded bg-surface-container">
                    Video #{video.id}
                  </span>
                  <span>•</span>
                  <span>AI Dubbing Pipeline</span>
                  <span>•</span>
                  <span className="text-primary font-semibold">Multilingual Studio</span>
                </div>
                <h2
                  id="embed-modal-title"
                  className="font-headline text-[22px] sm:text-[24px] text-primary font-normal tracking-tight"
                >
                  Embed AI Dubbed Language
                </h2>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                aria-label="Close modal"
                className="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-container-high text-secondary hover:text-primary flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Error Banner */}
              {errorMessage && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs font-body flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <span className="font-semibold block uppercase tracking-wider">Pipeline Error</span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Success Banner */}
              {successMessage && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-body flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-semibold block uppercase tracking-wider text-emerald-800">Success</span>
                    <span>{successMessage}</span>
                  </div>
                </div>
              )}

              {/* Live Progress Bar Section (Visible during and right after pipeline) */}
              {isPending && (
                <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container-high space-y-3">
                  <div className="flex items-center justify-between text-xs font-body">
                    <span className="font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Processing Dubbing Stream
                    </span>
                    <span className="font-mono font-bold text-primary text-sm">
                      {Math.round(progressPercent)}%
                    </span>
                  </div>

                  {/* Visual Progress Track */}
                  <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden p-0.5 border border-surface-container-high">
                    <motion.div
                      className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <p className="font-mono text-[11px] text-secondary">
                    {currentStageText || 'Executing pipeline...'}
                  </p>
                </div>
              )}

              {/* Search / Filter Languages */}
              <div className="space-y-1.5">
                <label className="block font-body text-xs uppercase tracking-wider font-semibold text-primary">
                  Select Target Language to Embed
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isPending}
                    placeholder="Search by language name or code (e.g. English, Finnish, vi)..."
                    className="w-full h-10 pl-9 pr-4 rounded-xl bg-surface-container-low border border-surface-container-high font-body text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-60"
                  />
                  <svg className="w-4 h-4 text-secondary absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Category 1: Voice Cloning Languages (XTTS-v2) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span className="font-body text-xs font-semibold text-primary uppercase tracking-wider">
                      Voice Cloning Languages (Coqui XTTS-v2)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Clones Speaker Voice
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {xttsLanguages.map((lang) => {
                    const isSelected = selectedLanguageCode === lang.code;
                    const isAlreadyDubbed = alreadyDubbedCodes.has(lang.code);
                    const isOriginal = video.original_language === lang.code;

                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setSelectedLanguageCode(lang.code)}
                        disabled={isPending}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 text-xs ${
                          isSelected
                            ? 'border-primary bg-primary text-on-primary ring-2 ring-primary/30 shadow-sm'
                            : 'border-surface-container-high bg-surface-container-low hover:bg-surface-container text-on-surface'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`font-mono uppercase font-bold text-[11px] ${isSelected ? 'text-on-primary' : 'text-primary'}`}>
                            {lang.code}
                          </span>
                          {isAlreadyDubbed && (
                            <span className={`text-[9px] font-semibold ${isSelected ? 'text-emerald-200' : 'text-emerald-700'}`}>
                              ✓ Dubbed
                            </span>
                          )}
                          {isOriginal && (
                            <span className={`text-[9px] font-semibold ${isSelected ? 'text-amber-200' : 'text-amber-700'}`}>
                              Original
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="font-medium truncate">{lang.name}</div>
                          <div className={`text-[10px] truncate ${isSelected ? 'text-on-primary/70' : 'text-secondary'}`}>
                            {lang.nativeName}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category 2: Standard Neural Languages (Edge-TTS) */}
              <div className="space-y-2.5 pt-2 border-t border-surface-container-high">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-body text-xs font-semibold text-primary uppercase tracking-wider">
                      Standard Neural Voice Languages (Edge-TTS)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Standard Neural (No Voice Cloning)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {edgeLanguages.map((lang) => {
                    const isSelected = selectedLanguageCode === lang.code;
                    const isAlreadyDubbed = alreadyDubbedCodes.has(lang.code);
                    const isOriginal = video.original_language === lang.code;

                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setSelectedLanguageCode(lang.code)}
                        disabled={isPending}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 text-xs ${
                          isSelected
                            ? 'border-primary bg-primary text-on-primary ring-2 ring-primary/30 shadow-sm'
                            : 'border-surface-container-high bg-surface-container-low hover:bg-surface-container text-on-surface'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`font-mono uppercase font-bold text-[11px] ${isSelected ? 'text-on-primary' : 'text-primary'}`}>
                            {lang.code}
                          </span>
                          {isAlreadyDubbed && (
                            <span className={`text-[9px] font-semibold ${isSelected ? 'text-emerald-200' : 'text-emerald-700'}`}>
                              ✓ Dubbed
                            </span>
                          )}
                          {isOriginal && (
                            <span className={`text-[9px] font-semibold ${isSelected ? 'text-amber-200' : 'text-amber-700'}`}>
                              Original
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="font-medium truncate">{lang.name}</div>
                          <div className={`text-[10px] truncate ${isSelected ? 'text-on-primary/70' : 'text-secondary'}`}>
                            {lang.nativeName}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Voice Engine Selection */}
              <div className="space-y-2.5 pt-2 border-t border-surface-container-high">
                <div className="flex items-center justify-between">
                  <span className="font-body text-xs font-semibold text-primary uppercase tracking-wider">
                    Voice Synthesis Engine
                  </span>
                  <span className="text-[11px] font-mono text-secondary">
                    {engineMode === 'edge' ? '⚡ Fast Cloud Neural (2~3s)' : '🎙️ Local Voice Cloning'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Edge-TTS (Default & Recommended) */}
                  <button
                    type="button"
                    onClick={() => setEngineMode('edge')}
                    disabled={isPending}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      engineMode === 'edge'
                        ? 'border-primary bg-surface-container-low ring-2 ring-primary/20 shadow-sm'
                        : 'border-surface-container-high bg-surface-container-lowest hover:bg-surface-container-low text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-body text-xs font-semibold text-primary flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Edge-TTS (Fast Neural)
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ⚡ Recommended (2~3s)
                      </span>
                    </div>
                    <p className="text-[11px] text-secondary leading-relaxed">
                      Giọng đọc phát thanh chuẩn Microsoft Azure. Sinh nhanh chỉ trong 2-3 giây, không gây nghẽn CPU/timeout.
                    </p>
                  </button>

                  {/* Option 2: Coqui XTTS-v2 Voice Cloning */}
                  <button
                    type="button"
                    onClick={() => selectedLanguage.supportsVoiceCloning && setEngineMode('xtts')}
                    disabled={isPending || !selectedLanguage.supportsVoiceCloning}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      !selectedLanguage.supportsVoiceCloning
                        ? 'opacity-40 border-surface-container-high bg-surface-container-low cursor-not-allowed text-secondary'
                        : engineMode === 'xtts'
                        ? 'border-primary bg-surface-container-low ring-2 ring-primary/20 shadow-sm cursor-pointer'
                        : 'border-surface-container-high bg-surface-container-lowest hover:bg-surface-container-low text-secondary cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-body text-xs font-semibold text-primary flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${selectedLanguage.supportsVoiceCloning ? 'bg-indigo-500' : 'bg-secondary/40'}`} />
                        Coqui XTTS-v2
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        🎙️ Voice Cloning
                      </span>
                    </div>
                    <p className="text-[11px] text-secondary leading-relaxed">
                      {selectedLanguage.supportsVoiceCloning
                        ? 'Tái tạo lại chất giọng nhân vật gốc. Cần nhiều tài nguyên CPU/GPU và mất nhiều thời gian hơn.'
                        : `Ngôn ngữ ${selectedLanguage.name} chưa hỗ trợ Voice Cloning trên XTTS-v2.`}
                    </p>
                  </button>
                </div>
              </div>

              {/* SPECIFIC MANDATORY DISCLAIMER NOTE FOR SELECTED LANGUAGE & ENGINE */}
              {!selectedLanguage.supportsVoiceCloning ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-body space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-amber-800">
                    <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Important Voice Model Notice: {selectedLanguage.name}</span>
                  </div>
                  <p className="leading-relaxed text-amber-950">
                    Ngôn ngữ <strong>{selectedLanguage.name} ({selectedLanguage.nativeName})</strong> sử dụng engine Edge-TTS. 
                    Hệ thống sẽ <strong>không thể lồng tiếng giống hoàn toàn với giọng người dùng (Voice Cloning)</strong> do ngôn ngữ này không thuộc mô hình XTTS-v2. 
                    Thay vào đó, hệ thống sẽ sử dụng giọng đọc chuẩn truyền thông (neural broadcast voice) với độ rõ ràng và tự nhiên cao.
                  </p>
                </div>
              ) : engineMode === 'xtts' ? (
                <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-300 text-indigo-900 text-xs font-body flex items-start gap-2">
                  <svg className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-semibold block uppercase tracking-wider text-indigo-800">
                      Voice Cloning Enabled ({selectedLanguage.name})
                    </span>
                    <p className="text-indigo-950 mt-0.5">
                      Coqui XTTS-v2 sẽ phân tích mẫu giọng nói gốc và mô phỏng âm sắc, cao độ sang {selectedLanguage.name}. 
                      Lưu ý: Quá trình này tính toán trực tiếp trên máy chủ và có thể mất từ vài phút.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-body flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div>
                    <span className="font-semibold block uppercase tracking-wider text-emerald-800">
                      Fast Neural Voice Selected ({selectedLanguage.name})
                    </span>
                    <p className="text-emerald-950 mt-0.5">
                      Đang sử dụng Microsoft Edge Neural TTS cho {selectedLanguage.name}. Thời gian hoàn tất chỉ khoảng 2–3 giây với giọng đọc tự nhiên chuẩn studio.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Sticky Footer */}
            <div className="px-6 py-4 border-t border-surface-container-high bg-surface-container-lowest flex items-center justify-between gap-3 sticky bottom-0 z-20">
              <div className="text-[11px] font-body text-secondary hidden sm:block">
                Target: <span className="font-semibold text-primary">{selectedLanguage.name}</span> ({selectedLanguage.code.toUpperCase()})
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isPending}
                  className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-body text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleStartDubbing}
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-neutral-800 text-on-primary font-body text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2 shadow-sm"
                >
                  {isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing ({Math.round(progressPercent)}%)...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                      </svg>
                      <span>Embed {selectedLanguage.name} Dubbing</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
