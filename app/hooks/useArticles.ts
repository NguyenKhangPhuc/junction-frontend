import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { articleApi } from '../services/api';
import { ArticleCreateRequest } from '../types/api';

export const articleKeys = {
  all: ['articles'] as const,
  lists: () => [...articleKeys.all, 'list'] as const,
  detail: (id: number) => [...articleKeys.all, 'detail', id] as const,
};

/**
 * Hook to fetch all articles ordered chronologically
 */
export function useArticles() {
  return useQuery({
    queryKey: articleKeys.lists(),
    queryFn: () => articleApi.getAll(),
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch article detail with associated videos
 */
export function useArticleDetail(articleId: number) {
  return useQuery({
    queryKey: articleKeys.detail(articleId),
    queryFn: () => articleApi.getById(articleId),
    enabled: Boolean(articleId),
  });
}

/**
 * Hook to create article with automatic vector embedding
 */
export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ArticleCreateRequest) => articleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
    },
  });
}

/**
 * Hook to delete an article
 */
export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleId: number) => articleApi.delete(articleId),
    onSuccess: (_, articleId) => {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
      queryClient.removeQueries({ queryKey: articleKeys.detail(articleId) });
    },
  });
}
