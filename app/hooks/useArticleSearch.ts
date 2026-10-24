'use client';

import { useQuery } from '@tanstack/react-query';
import { searchArticles } from '../services/articleService';
import { ArticleSearchRequest, ArticleSearchResponse } from '../types/article';

export const useArticleSearch = (
  params: ArticleSearchRequest,
  enabled: boolean = true
) => {
  return useQuery<ArticleSearchResponse, Error>({
    queryKey: ['articles', 'search', params.query, params.limit, params.min_similarity],
    queryFn: () => searchArticles(params),
    enabled: enabled && params.query.trim().length > 0,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

export default useArticleSearch;
