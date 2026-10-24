'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface ModalConfig {
  title: string;
  message?: ReactNode | string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  onConfirm?: () => Promise<void> | void;
}

interface DynamicModalContextValue {
  isOpen: boolean;
  title: string;
  message?: ReactNode | string;
  confirmText: string;
  cancelText: string;
  variant: 'danger' | 'primary' | 'warning';
  isLoading: boolean;
  openModal: (config: ModalConfig) => void;
  closeModal: () => void;
  handleConfirm: () => Promise<void>;
}

const DynamicModalContext = createContext<DynamicModalContextValue | undefined>(undefined);

export function DynamicModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState<ReactNode | string | undefined>(undefined);
  const [confirmText, setConfirmText] = useState('Confirm');
  const [cancelText, setCancelText] = useState('Cancel');
  const [variant, setVariant] = useState<'danger' | 'primary' | 'warning'>('primary');
  const [isLoading, setIsLoading] = useState(false);
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => Promise<void> | void) | undefined>(undefined);

  const openModal = useCallback((config: ModalConfig) => {
    setTitle(config.title);
    setMessage(config.message);
    setConfirmText(config.confirmText || 'Confirm');
    setCancelText(config.cancelText || 'Cancel');
    setVariant(config.variant || 'primary');
    setOnConfirmCallback(() => config.onConfirm);
    setIsLoading(false);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (isLoading) return;
    setIsOpen(false);
    setOnConfirmCallback(undefined);
  }, [isLoading]);

  const handleConfirm = useCallback(async () => {
    if (!onConfirmCallback) {
      setIsOpen(false);
      return;
    }
    try {
      setIsLoading(true);
      await onConfirmCallback();
      setIsOpen(false);
    } catch (error) {
      console.error('[DynamicModal] Error during onConfirm execution:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onConfirmCallback]);

  return (
    <DynamicModalContext.Provider
      value={{
        isOpen,
        title,
        message,
        confirmText,
        cancelText,
        variant,
        isLoading,
        openModal,
        closeModal,
        handleConfirm,
      }}
    >
      {children}
    </DynamicModalContext.Provider>
  );
}

export function useDynamicModal() {
  const context = useContext(DynamicModalContext);
  if (!context) {
    throw new Error('useDynamicModal must be used within a DynamicModalProvider');
  }
  return context;
}
