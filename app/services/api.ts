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

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5605/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/** -------------------------------------------------------------
 * ARTICLE SERVICES
 * ------------------------------------------------------------*/
export const articleApi = {
  create: async (data: ArticleCreateRequest): Promise<ArticleResponse> => {
    const res = await apiClient.post<ArticleResponse>('/articles', data);
    return res.data;
  },

  getAll: async (): Promise<ArticleResponse[]> => {
    const res = await apiClient.get<ArticleResponse[]>('/articles');
    return res.data;
  },

  getById: async (articleId: number): Promise<ArticleDetailResponse> => {
    const res = await apiClient.get<ArticleDetailResponse>(`/articles/${articleId}`);
    return res.data;
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
