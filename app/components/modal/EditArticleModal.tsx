'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { ArticleCreateRequest, ArticleResponse } from '@/app/types/api';
import { useUpdateArticle, useArticleDetail } from '@/app/hooks/useArticles';
import { useUploadVideo } from '@/app/hooks/useVideos';

const languageOptions = [
  { value: 'vi', label: 'Tiếng Việt (Vietnamese)' },
  { value: 'en', label: 'English (Nordic / Global)' },
  { value: 'fi', label: 'Suomi (Finnish)' },
  { value: 'sv', label: 'Svenska (Swedish)' },
  { value: 'es', label: 'Español (Spanish)' },
  { value: 'de', label: 'Deutsch (German)' },
] as const;

export interface VideoItem {
  id?: number;
  fileName: string;
  playbackUrl: string;
  duration?: number | null | string;
  originalLanguage: string;
  isLocalPreview?: boolean;
  fileSize?: string;
  blobUrlToRevoke?: string;
}

export interface EditArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: ArticleResponse | null;
  onSuccess?: (updatedArticle: ArticleResponse) => void;
}

export function EditArticleModal({
  isOpen,
  onClose,
  article,
  onSuccess,
}: EditArticleModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sessionVideos, setSessionVideos] = useState<VideoItem[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // React Hook Form for Article editing
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

  const updateArticleMutation = useUpdateArticle();
  const uploadVideoMutation = useUploadVideo();

  // Fetch article detail to inspect all existing associated videos from the database
  const { data: articleDetail, refetch: refetchArticleDetail } = useArticleDetail(
    article?.id || 0
  );

  // Sync form state and reset session videos when active article changes
  useEffect(() => {
    if (article) {
      reset({
        title: article.title,
        author: article.author || '',
        original_language: article.original_language || 'vi',
        content: article.content,
      });
      setSessionVideos([]);
      setUploadError(null);
      setSaveError(null);
      setUploadingCount(0);
    }
  }, [article, reset]);

  // Clean up any blob URLs created in this session when modal unmounts or changes
  useEffect(() => {
    return () => {
      sessionVideos.forEach((v) => {
        if (v.blobUrlToRevoke && v.blobUrlToRevoke.startsWith('blob:')) {
          URL.revokeObjectURL(v.blobUrlToRevoke);
        }
      });
    };
  }, [sessionVideos]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        isOpen &&
        uploadingCount === 0 &&
        !uploadVideoMutation.isPending &&
        !updateArticleMutation.isPending
      ) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, uploadingCount, uploadVideoMutation.isPending, updateArticleMutation.isPending, onClose]);

  // Format file size helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Convert database videos to VideoItem objects
  const existingVideos: VideoItem[] = useMemo(() => {
    if (!articleDetail?.videos || articleDetail.videos.length === 0) return [];
    const apiHost =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5605';

    return articleDetail.videos.map((v) => ({
      id: v.id,
      fileName: v.file_name,
      playbackUrl: `${apiHost}${v.file_path}`,
      duration: v.duration ? `${v.duration.toFixed(1)}s` : null,
      originalLanguage: v.original_language,
      isLocalPreview: false,
    }));
  }, [articleDetail]);

  // Combine existing database videos and session-uploaded videos (preventing duplicates)
  const allVideos: VideoItem[] = useMemo(() => {
    const map = new Map<string, VideoItem>();

    // 1. Add existing database videos
    for (const v of existingVideos) {
      map.set(v.id ? `id-${v.id}` : v.fileName, v);
    }

    // 2. Merge session videos (prefer session videos for instant local preview playback)
    for (const v of sessionVideos) {
      const key = v.id ? `id-${v.id}` : v.fileName;
      map.set(key, v);
    }

    return Array.from(map.values());
  }, [existingVideos, sessionVideos]);

  // Multi-file video upload & processing handler
  const handleProcessFiles = async (files: FileList | File[]) => {
    if (!article) return;
    setUploadError(null);
    const fileArray = Array.from(files);

    const validFiles = fileArray.filter(
      (file) =>
        file.type.startsWith('video/') ||
        /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(file.name)
    );

    if (validFiles.length === 0) {
      setUploadError('Invalid format. Please select valid video files (.mp4, .webm, .mov, .mkv).');
      return;
    }

    setUploadingCount(validFiles.length);

    for (const file of validFiles) {
      // 1. Immediate client-side object URL for 0ms latency playback
      const localBlobUrl = URL.createObjectURL(file);
      const currentLanguage = watch('original_language') || article.original_language || 'vi';

      const tempItem: VideoItem = {
        fileName: file.name,
        playbackUrl: localBlobUrl,
        fileSize: formatBytes(file.size),
        originalLanguage: currentLanguage,
        isLocalPreview: true,
        blobUrlToRevoke: localBlobUrl,
      };

      // Add to session immediately so video player renders and is playable right away!
      setSessionVideos((prev) => [tempItem, ...prev]);

      // 2. Concurrently upload to server via useUploadVideo
      try {
        const uploadedData = await uploadVideoMutation.mutateAsync({
          file,
          articleId: article.id,
          originalLanguage: currentLanguage,
        });

        // Update item with server ID and probed duration
        setSessionVideos((prev) =>
          prev.map((item) =>
            item.fileName === file.name
              ? {
                  ...item,
                  id: uploadedData.id,
                  duration: uploadedData.duration
                    ? `${uploadedData.duration.toFixed(1)}s`
                    : item.duration,
                  isLocalPreview: false,
                }
              : item
          )
        );

        refetchArticleDetail();
      } catch (err: unknown) {
        console.error('[EditArticleModal] Video upload failed for:', file.name, err);
        let errorMsg = `Failed to upload ${file.name}.`;
        if (err instanceof Error) {
          errorMsg = `${file.name}: ${err.message}`;
        }
        setUploadError(errorMsg);
      }
    }

    setUploadingCount(0);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFiles(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFiles(files);
    }
    // Reset file input value so re-selecting same file works
    e.target.value = '';
  };

  // Form submit handler
  const onSubmit = async (formData: ArticleCreateRequest) => {
    if (!article) return;
    setSaveError(null);

    try {
      const updated = await updateArticleMutation.mutateAsync({
        id: article.id,
        data: formData,
      });

      if (onSuccess) {
        onSuccess(updated);
      }
      onClose();
    } catch (err: unknown) {
      console.error('[EditArticleModal] Save failed:', err);
      let errorMsg = 'Failed to save article changes.';
      if (err instanceof Error) {
        errorMsg = err.message;
      }
      setSaveError(errorMsg);
    }
  };

  const isPending =
    updateArticleMutation.isPending ||
    uploadVideoMutation.isPending ||
    uploadingCount > 0;

  return (
    <AnimatePresence>
      {isOpen && article && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-article-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          {/* Blurred Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !isPending && onClose()}
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-4xl bg-surface-container-lowest border border-surface-container-high rounded-2xl shadow-2xl z-10 flex flex-col my-auto max-h-[92vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-surface-container-high flex items-center justify-between gap-4 bg-surface-container-lowest/80 backdrop-blur-sm sticky top-0 z-20">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-[11px] font-body text-secondary uppercase tracking-widest">
                  <span className="font-mono font-bold text-primary px-1.5 py-0.5 rounded bg-surface-container">
                    #{article.id}
                  </span>
                  <span>•</span>
                  <span>Dispatch Editor</span>
                  <span>•</span>
                  <span className="text-primary font-semibold">
                    {allVideos.length} {allVideos.length === 1 ? 'Video' : 'Videos'} Attached
                  </span>
                </div>
                <h2
                  id="edit-article-modal-title"
                  className="font-headline text-[22px] sm:text-[26px] text-primary font-normal tracking-tight line-clamp-1"
                >
                  Edit Dispatch &amp; Associated Videos
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
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
              {/* Save Error Alert */}
              {saveError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs font-body flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <span className="font-semibold block uppercase tracking-wider">Save Error</span>
                    <span>{saveError}</span>
                  </div>
                </div>
              )}

              {/* Form Fields: React Hook Form */}
              <form id="edit-article-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Title Input */}
                <div className="space-y-1.5">
                  <label htmlFor="modal-edit-title" className="block font-body text-xs uppercase tracking-wider font-semibold text-primary">
                    Article Title <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="modal-edit-title"
                    type="text"
                    disabled={isPending}
                    {...register('title', {
                      required: 'Title is required.',
                      minLength: { value: 5, message: 'Title must be at least 5 characters.' },
                    })}
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-surface-container-high font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-60"
                  />
                  {errors.title && (
                    <p className="text-xs text-red-600 font-body">{errors.title.message}</p>
                  )}
                </div>

                {/* Sub-grid: Author & Language */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Author Input */}
                  <div className="space-y-1.5">
                    <label htmlFor="modal-edit-author" className="block font-body text-xs uppercase tracking-wider font-semibold text-primary">
                      Author / Byline
                    </label>
                    <input
                      id="modal-edit-author"
                      type="text"
                      disabled={isPending}
                      {...register('author')}
                      placeholder="e.g. Pohjola Editorial Staff"
                      className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-surface-container-high font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-60"
                    />
                  </div>

                  {/* Language Selector */}
                  <div className="space-y-1.5">
                    <label htmlFor="modal-edit-language" className="block font-body text-xs uppercase tracking-wider font-semibold text-primary">
                      Original Language
                    </label>
                    <select
                      id="modal-edit-language"
                      disabled={isPending}
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

                {/* Content Multi-line Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="modal-edit-content" className="block font-body text-xs uppercase tracking-wider font-semibold text-primary">
                      Article Content <span className="text-red-600">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-secondary">
                      Paragraph breaks preserved
                    </span>
                  </div>
                  <textarea
                    id="modal-edit-content"
                    rows={6}
                    disabled={isPending}
                    {...register('content', {
                      required: 'Article content cannot be empty.',
                      minLength: { value: 20, message: 'Content must be at least 20 characters.' },
                    })}
                    className="w-full p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-60 leading-relaxed"
                  />
                  {errors.content && (
                    <p className="text-xs text-red-600 font-body">{errors.content.message}</p>
                  )}
                </div>
              </form>

              {/* ---------------------------------------------------------
               * SECTION: ASSOCIATED VIDEOS GALLERY (MULTIPLE VIDEOS)
               * --------------------------------------------------------*/}
              <div className="pt-4 border-t border-surface-container-high space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="font-headline text-[18px] text-primary font-medium flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Associated Video Media
                    </h3>
                    <p className="font-body text-xs text-secondary mt-0.5">
                      This article has {allVideos.length} {allVideos.length === 1 ? 'video' : 'videos'}. You can play any video directly or drop more files to link additional footage.
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-surface-container-high text-on-surface text-xs font-mono font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {allVideos.length} {allVideos.length === 1 ? 'Video' : 'Videos'} Linked
                  </span>
                </div>

                {/* Video Upload Error Alert */}
                {uploadError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs font-body flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <span className="font-semibold block uppercase tracking-wider">Video Upload Issue</span>
                      <span>{uploadError}</span>
                    </div>
                  </div>
                )}

                {/* MULTIPLE VIDEO PLAYERS GRID */}
                {allVideos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allVideos.map((video, idx) => (
                      <div
                        key={video.id ? `vid-${video.id}` : `session-${video.fileName}-${idx}`}
                        className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high/80 space-y-3 flex flex-col justify-between shadow-sm hover:border-primary/40 transition-colors"
                      >
                        {/* Video Metadata Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-secondary mb-1 flex-wrap">
                              {video.id ? (
                                <span className="font-bold text-primary px-1.5 py-0.5 rounded bg-surface-container">
                                  #{video.id}
                                </span>
                              ) : (
                                <span className="font-bold text-emerald-800 px-1.5 py-0.5 rounded bg-emerald-100">
                                  New
                                </span>
                              )}
                              <span className="uppercase font-semibold px-1.5 py-0.5 rounded bg-surface-container text-on-surface">
                                {video.originalLanguage}
                              </span>
                              {video.duration && (
                                <span className="text-secondary font-mono">
                                  • {video.duration}
                                </span>
                              )}
                              {video.fileSize && (
                                <span className="text-secondary font-mono">
                                  • {video.fileSize}
                                </span>
                              )}
                            </div>

                            <h4
                              className="font-headline text-[15px] text-primary font-medium truncate"
                              title={video.fileName}
                            >
                              {video.fileName}
                            </h4>
                          </div>

                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-mono font-medium flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Ready
                          </span>
                        </div>

                        {/* Interactive HTML5 Video Player */}
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-surface-container-high shadow-inner flex items-center justify-center">
                          <video
                            key={video.playbackUrl}
                            src={video.playbackUrl}
                            controls
                            playsInline
                            preload="metadata"
                            className="w-full h-full object-contain"
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>

                        {/* Video Card Footer */}
                        <div className="flex items-center justify-between text-[11px] font-body text-secondary pt-1 border-t border-surface-container-high/40">
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Controls: Play, Seek, Fullscreen
                          </span>
                          <span className="font-mono text-[10px]">AI Pipeline Ready</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Empty state when no videos are attached */
                  <div className="p-4 rounded-xl bg-surface-container-low border border-dashed border-surface-container-high text-center text-xs font-body text-secondary">
                    No videos attached to this article yet. Use the dropzone below to link media.
                  </div>
                )}

                {/* MULTI-FILE DRAG & DROP ZONE (Always available to add more videos) */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isPending && fileInputRef.current?.click()}
                  className={`relative p-6 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer text-center ${
                    isDragging
                      ? 'border-primary bg-surface-container'
                      : 'border-surface-container-high hover:border-primary/50 bg-surface-container-lowest hover:bg-surface-container-low'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="video/mp4,video/webm,video/quicktime,video/mkv,video/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {uploadingCount > 0 ? (
                    <div className="py-4 space-y-3">
                      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      <div>
                        <p className="font-body text-sm font-semibold text-primary">
                          Uploading {uploadingCount} {uploadingCount === 1 ? 'Video' : 'Videos'}...
                        </p>
                        <p className="font-body text-xs text-secondary mt-0.5">
                          Streaming chunks to <code className="font-mono text-primary">POST /api/videos</code> and registering duration.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 py-2">
                      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mx-auto text-primary">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>

                      <div>
                        <p className="font-body text-sm font-medium text-primary">
                          <span className="font-semibold underline">Click to browse</span> or drag &amp; drop video files here
                        </p>
                        <p className="font-body text-xs text-secondary mt-1">
                          You can select or drop multiple videos at once (MP4, WebM, MOV, MKV up to 500MB each).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Sticky Footer */}
            <div className="px-6 py-4 border-t border-surface-container-high bg-surface-container-lowest flex items-center justify-between gap-3 sticky bottom-0 z-20">
              <div className="text-[11px] font-body text-secondary hidden sm:block">
                Saving updates text content and regenerates 1024-dim dense embedding.
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-body text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="edit-article-form"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-neutral-800 text-on-primary font-body text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2 shadow-sm"
                >
                  {updateArticleMutation.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Dispatch...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Save Changes</span>
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
