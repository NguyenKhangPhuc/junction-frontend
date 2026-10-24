'use client';

import { FolderProgressResponse } from '@/app/types/folder.types';

export function useFolderProgress(folderId?: string | null): {
  data: FolderProgressResponse | undefined;
  isLoading: boolean;
} {
  void folderId;
  return {
    data: undefined,
    isLoading: false,
  };
}
