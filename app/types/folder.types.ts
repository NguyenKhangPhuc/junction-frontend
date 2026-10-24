export interface FolderProgressResponse {
  status: 'pending' | 'processing' | 'ready' | 'partial' | 'failed';
  progress?: number;
  total?: number;
  message?: string;
}
