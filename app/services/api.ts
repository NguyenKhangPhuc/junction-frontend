import axios from 'axios';
import {
  ArticleCreateRequest,
  ArticleDetailResponse,
  ArticleResponse,
  DubbedDeleteResponse,
  DubbedLanguagesResponse,
  MessageResponse,
  VideoDetailResponse,
  VideoProcessRequest,
  VideoProcessResponse,
} from '../types/api';

const formatApiBaseUrl = (raw?: string): string => {
  const fallback = 'http://localhost:5605/api';
  if (!raw) return fallback;
  const cleaned = raw.trim().replace(/\/+$/, '');
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
};

const apiClient = axios.create({
  baseURL: formatApiBaseUrl(process.env.NEXT_PUBLIC_API_URL),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Centralized error logging interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      console.error(
        `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.baseURL || ''}${error.config?.url || ''} failed (HTTP ${error.response?.status || 'Network/Timeout'}):`,
        error.response?.data || error.message
      );
    } else {
      console.error('[API Error] Request failed:', error);
    }
    return Promise.reject(error);
  }
);

/** -------------------------------------------------------------
 * ARTICLE SERVICES
 * ------------------------------------------------------------*/
export const articleApi = {
  create: async (data: ArticleCreateRequest): Promise<ArticleResponse> => {
    try {
      const res = await apiClient.post<ArticleResponse>('/articles', data);
      return res.data;
    } catch (error) {
      console.error('[articleApi.create] Failed to create article in backend:', error);
      throw error;
    }
  },

  getAll: async (): Promise<ArticleResponse[]> => {
    const res = await apiClient.get<ArticleResponse[]>('/articles');
    return res.data;
  },

  getById: async (articleId: number): Promise<ArticleDetailResponse> => {
    const res = await apiClient.get<ArticleDetailResponse>(`/articles/${articleId}`);
    return res.data;
  },

  update: async (articleId: number, data: ArticleCreateRequest): Promise<ArticleResponse> => {
    try {
      const res = await apiClient.put<ArticleResponse>(`/articles/${articleId}`, data);
      return res.data;
    } catch (error) {
      console.error(`[articleApi.update] Failed to update article ${articleId}:`, error);
      throw error;
    }
  },

  delete: async (articleId: number): Promise<MessageResponse> => {
    const res = await apiClient.delete<MessageResponse>(`/articles/${articleId}`);
    return res.data;
  },
};

export interface DubbingProgressEvent {
  stage: 'init' | 'audio' | 'stt' | 'translate' | 'tts_prepare' | 'tts' | 'merge' | 'completed' | 'error';
  percent: number;
  message: string;
  error?: string;
  data?: VideoProcessResponse;
}

/** -------------------------------------------------------------
 * VIDEO & DUBBING SERVICES
 * ------------------------------------------------------------*/
export const videoApi = {
  /**
   * Upload video file using multipart/form-data.
   * Path will be saved as /data/videos/raw/...
   */
  upload: async (
    file: File,
    articleId?: number,
    originalLanguage: string = 'vi'
  ): Promise<VideoDetailResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (articleId !== undefined && articleId !== null) {
      formData.append('article_id', articleId.toString());
    }
    formData.append('original_language', originalLanguage);

    const res = await apiClient.post<VideoDetailResponse>('/videos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  getAll: async (): Promise<VideoDetailResponse[]> => {
    const res = await apiClient.get<VideoDetailResponse[]>('/videos');
    return res.data;
  },

  getById: async (videoId: number): Promise<VideoDetailResponse> => {
    const res = await apiClient.get<VideoDetailResponse>(`/videos/${videoId}`);
    return res.data;
  },

  /**
   * Trigger AI pipeline: STT -> Translation -> TTS -> Video Merge (Standard)
   */
  processDubbing: async (data: VideoProcessRequest): Promise<VideoProcessResponse> => {
    const res = await apiClient.post<VideoProcessResponse>('/videos/process', data, {
      timeout: 10 * 60 * 1000
    });
    return res.data;
  },

  /**
   * Trigger AI pipeline with real-time SSE progress streaming via Axios
   */
  processDubbingStream: async (
    data: VideoProcessRequest,
    onProgress?: (event: DubbingProgressEvent) => void,
    signal?: AbortSignal
  ): Promise<VideoProcessResponse> => {
    let seenLength = 0;
    let finalResult: VideoProcessResponse | null = null;
    let streamError: string | null = null;

    const res = await apiClient.post<string>('/videos/process-stream', data, {
      responseType: 'text',
      timeout: 0, // No client timeout for AI streaming
      signal,
      onDownloadProgress: (progressEvent) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyTarget = (progressEvent as any).event?.target || (progressEvent as any).target;
        const responseText: string = anyTarget?.responseText || '';
        if (!responseText || responseText.length <= seenLength) return;

        const chunk = responseText.slice(seenLength);
        seenLength = responseText.length;

        const lines = chunk.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const event: DubbingProgressEvent = JSON.parse(trimmed.slice(6));
              if (onProgress) {
                onProgress(event);
              }
              if (event.stage === 'error') {
                streamError = event.error || 'Dubbing pipeline encountered an error.';
              }
              if (event.stage === 'completed' && event.data) {
                finalResult = event.data;
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }
      },
    });

    if (streamError) {
      throw new Error(streamError);
    }

    if (finalResult) {
      return finalResult;
    }

    // Fallback: parse entire response body in case onDownloadProgress didn't fire for the final chunk
    if (typeof res.data === 'string') {
      const lines = res.data.split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line.startsWith('data: ')) {
          try {
            const event: DubbingProgressEvent = JSON.parse(line.slice(6));
            if (event.stage === 'error') {
              throw new Error(event.error || 'Dubbing pipeline failed.');
            }
            if (event.stage === 'completed' && event.data) {
              return event.data;
            }
          } catch {
            // continue
          }
        }
      }
    }

    throw new Error('Dubbing stream concluded without completion payload.');
  },

  /**
   * Get all dubbed versions and available language codes for a video
   */
  getDubbedLanguages: async (videoId: number): Promise<DubbedLanguagesResponse> => {
    const res = await apiClient.get<DubbedLanguagesResponse>(`/videos/${videoId}/dubbed`);
    return res.data;
  },

  /**
   * Delete a dubbed version by target language (removes DB record and media files)
   */
  deleteDubbedLanguage: async (
    videoId: number,
    targetLanguage: string
  ): Promise<DubbedDeleteResponse> => {
    const res = await apiClient.delete<DubbedDeleteResponse>(
      `/videos/${videoId}/dubbed/${targetLanguage}`
    );
    return res.data;
  },
};
