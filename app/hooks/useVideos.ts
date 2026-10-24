import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { videoApi } from '../services/api';
import { VideoProcessRequest } from '../types/api';

export const videoKeys = {
  all: ['videos'] as const,
  lists: () => [...videoKeys.all, 'list'] as const,
  detail: (id: number) => [...videoKeys.all, 'detail', id] as const,
  dubbed: (id: number) => [...videoKeys.all, 'dubbed', id] as const,
};

/**
 * Hook to fetch all videos
 */
export function useVideos() {
  return useQuery({
    queryKey: videoKeys.lists(),
    queryFn: () => videoApi.getAll(),
    retry: 1,
  });
}

/**
 * Hook to fetch a single video by ID
 */
export function useVideoDetail(videoId: number) {
  return useQuery({
    queryKey: videoKeys.detail(videoId),
    queryFn: () => videoApi.getById(videoId),
    enabled: Boolean(videoId),
  });
}

/**
 * Hook to upload a raw video file (multipart/form-data)
 */
export function useUploadVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      articleId,
      originalLanguage,
    }: {
      file: File;
      articleId?: number;
      originalLanguage?: string;
    }) => videoApi.upload(file, articleId, originalLanguage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
    },
  });
}

/**
 * Hook to trigger the AI Dubbing pipeline for a video
 */
export function useProcessDubbing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VideoProcessRequest) => videoApi.processDubbing(payload),
    onSuccess: (data) => {
      // Refresh video details and available dubbed languages
      queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: videoKeys.detail(data.video_id) });
      queryClient.invalidateQueries({ queryKey: videoKeys.dubbed(data.video_id) });
    },
  });
}

/**
 * Hook to get all available dubbed versions and language codes for a video
 */
export function useDubbedLanguages(videoId: number) {
  return useQuery({
    queryKey: videoKeys.dubbed(videoId),
    queryFn: () => videoApi.getDubbedLanguages(videoId),
    enabled: Boolean(videoId),
  });
}

/**
 * Hook to delete a specific dubbed language version and delete its disk files
 */
export function useDeleteDubbedLanguage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      videoId,
      targetLanguage,
    }: {
      videoId: number;
      targetLanguage: string;
    }) => videoApi.deleteDubbedLanguage(videoId, targetLanguage),
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: videoKeys.detail(videoId) });
      queryClient.invalidateQueries({ queryKey: videoKeys.dubbed(videoId) });
    },
  });
}
