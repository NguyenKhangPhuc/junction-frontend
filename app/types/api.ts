/**
 * API Schemas and TypeScript Interfaces
 * Common schemas, article models, video and dubbing pipelines, and regional dispatches.
 */

/** -------------------------------------------------------------
 * COMMON & TRANSCRIPT SCHEMAS
 * ------------------------------------------------------------*/
export interface TranscriptSegment {
  start: number; // Start time in seconds (e.g. 4.18)
  end: number;   // End time in seconds (e.g. 6.70)
  text: string;  // Segment speech text
}

/** -------------------------------------------------------------
 * ARTICLE SCHEMAS
 * ------------------------------------------------------------*/
export interface ArticleCreateRequest {
  title: string;
  content: string;
  original_language?: string; // Default: "vi"
  author?: string;
}

export interface ArticleResponse {
  id: number;
  title: string;
  content: string;
  original_language: string;
  author: string | null;
  has_embedding: boolean;
  created_at: string;
}

export interface ArticleDetailResponse extends ArticleResponse {
  videos: VideoDetailResponse[];
}

/** -------------------------------------------------------------
 * VIDEO & DUBBING SCHEMAS
 * ------------------------------------------------------------*/
export interface DubbedVersionResponse {
  id: number;
  video_id: number;
  target_language: string;
  transcript_text: string | null;
  transcript_json: TranscriptSegment[] | null;
  dubbed_audio_path: string | null;
  dubbed_video_path: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  is_default_file: boolean;
  created_at: string;
}

export interface VideoDetailResponse {
  id: number;
  article_id: number | null;
  file_name: string;
  file_path: string;
  original_audio_path: string | null;
  duration: number | null; // In seconds
  original_language: string;
  original_transcript_text: string | null;
  original_transcript_json: TranscriptSegment[] | null;
  is_default_file: boolean;
  created_at: string;
  dubbed_versions: DubbedVersionResponse[];
}

export interface VideoProcessRequest {
  video_path: string;          // e.g. "/data/videos/raw/sample.mp4"
  target_language?: string;    // e.g. "en", "vi", "es" (Default: "en")
  article_id?: number;
  voice?: string;              // Specific TTS voice override
  tts_engine?: 'xtts' | 'edge'; // Default: "xtts"
}

export interface VideoProcessResponse {
  video_id: number;
  file_name: string;
  file_path: string;
  original_audio_path: string | null;
  duration: number | null;
  original_language: string;
  original_transcript_text: string | null;
  original_transcript_json: TranscriptSegment[] | null;
  is_default_file: boolean;
  dubbed_version: DubbedVersionResponse;
}

export interface DubbedLanguagesResponse {
  video_id: number;
  languages: string[]; // e.g. ["en", "es", "fi"]
  dubbed_versions: DubbedVersionResponse[];
}

export interface DubbedDeleteResponse {
  video_id: number;
  target_language: string;
  message: string;
  deleted_files: string[];
}

export interface MessageResponse {
  message: string;
}

/** -------------------------------------------------------------
 * REGIONAL DISPATCH SCHEMAS (EDITORIAL UI)
 * ------------------------------------------------------------*/
export interface RegionalDispatch {
  id: string | number;
  city: 'Helsinki' | 'Oulu' | 'Tampere' | 'Turku' | 'Rovaniemi' | 'Espoo';
  bureau: string;
  coordinates: string;
  category: string;
  topic: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  imageAlt: string;
  timeAgo: string;
  isRealData?: boolean;
}
