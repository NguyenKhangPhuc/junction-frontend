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
   * Trigger AI pipeline: STT -> Translation -> TTS -> Video Merge
   */
  processDubbing: async (data: VideoProcessRequest): Promise<VideoProcessResponse> => {
    const res = await apiClient.post<VideoProcessResponse>('/videos/process', data);
    return res.data;
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
