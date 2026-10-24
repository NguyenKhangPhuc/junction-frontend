/**
 * Article and Semantic Search TypeScript Interfaces
 * Supports pgvector Cosine Distance and intfloat/multilingual-e5-large similarity search.
 */

export interface ArticleBase {
  title: string;
  content: string;
  original_language: string;
  author?: string | null;
}

export interface ArticleSearchResultItem extends ArticleBase {
  id: number;
  similarity_score: number; // Similarity score from 0.0 to 1.0 (1.0 - cosine_distance)
  distance: number;         // Cosine distance
  created_at: string;
}

export interface ArticleSearchRequest {
  query: string;
  limit?: number;
  min_similarity?: number;
}

export interface ArticleSearchResponse {
  query: string;
  total_results: number;
  results: ArticleSearchResultItem[];
}
