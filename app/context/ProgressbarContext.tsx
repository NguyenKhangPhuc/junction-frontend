'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useFolderProgress } from '@/app/hooks/query/useFolderProgress';
import { FolderProgressResponse } from '@/app/types/folder.types';

// The type of the Progressbar controller
interface ProgressbarContextType {
  activeFolderId: string | null;
  isOpen: boolean;
  progressData: FolderProgressResponse | undefined;
  isLoading: boolean;
  trackFolder: (folderId: string) => void;
  clearTracking: () => void;
}

// Create the context
const ProgressbarContext = createContext<ProgressbarContextType | undefined>(undefined);

// Storage key for active folder embedding tracking
const STORAGE_KEY = 'active_embed_folder_id';

// Create the provider and pass the controller to every child in provider
export const ProgressbarProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize from localStorage if present to maintain tracking across page reloads (F5)
  const [activeFolderId, setActiveFolderId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY);
    }
    return null;
  });

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return Boolean(localStorage.getItem(STORAGE_KEY));
    }
    return false;
  });

  // Poll progress metrics for the currently tracked folder
  const { data: progressData, isLoading } = useFolderProgress(activeFolderId);

  const trackFolder = useCallback((folderId: string) => {
    setActiveFolderId(folderId);
    setIsOpen(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, folderId);
    }
  }, []);

  const clearTracking = useCallback(() => {
    setActiveFolderId(null);
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // When progress reaches terminal state ('ready', 'partial', 'failed'),
  // immediately delete it from localStorage and auto-dismiss after 5 seconds
  useEffect(() => {
    if (progressData && ['ready', 'partial', 'failed'].includes(progressData.status)) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      const timer = setTimeout(() => {
        clearTracking();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [progressData, clearTracking]);

  return (
    <ProgressbarContext.Provider
      value={{
        activeFolderId,
        isOpen,
        progressData,
        isLoading,
        trackFolder,
        clearTracking,
      }}
    >
      {children}
    </ProgressbarContext.Provider>
  );
};

// Custom hook to access progressbar controller from context
export const useProgressbar = () => {
  const context = useContext(ProgressbarContext);
  if (!context) {
    throw new Error('useProgressbar must be used within ProgressbarProvider');
  }
  return context;
};
