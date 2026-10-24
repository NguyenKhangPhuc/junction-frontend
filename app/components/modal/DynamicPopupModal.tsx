'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDynamicModal } from '@/app/context/DynamicModalContext';

export interface DynamicPopupModalProps {
  title?: string;
}

export function DynamicPopupModal({ title: propTitle }: DynamicPopupModalProps) {
  const {
    isOpen,
    title: contextTitle,
    message,
    confirmText,
    cancelText,
    variant,
    isLoading,
    closeModal,
    handleConfirm,
  } = useDynamicModal();

  // Prefer propTitle if explicitly passed, otherwise use context title
  const displayTitle = propTitle || contextTitle;

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, closeModal]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dynamic-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Blurred Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeModal}
            className="fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity cursor-pointer"
          />

          {/* Centered Modal Content Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-lg bg-surface-container-lowest border border-surface-container-high rounded-2xl p-6 sm:p-8 shadow-2xl z-10 space-y-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {variant === 'danger' && (
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                )}
                {variant === 'warning' && (
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                )}
                {variant === 'primary' && (
                  <div className="w-10 h-10 rounded-full bg-surface-container text-primary flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}

                <div>
                  <h3
                    id="dynamic-modal-title"
                    className="font-headline text-[22px] sm:text-[24px] leading-tight text-primary font-medium tracking-tight"
                  >
                    {displayTitle}
                  </h3>
                  <span className="block text-[11px] font-body text-secondary uppercase tracking-widest mt-0.5">
                    Newsroom Action Required
                  </span>
                </div>
              </div>

              {/* Close Icon Button */}
              <button
                type="button"
                onClick={closeModal}
                disabled={isLoading}
                aria-label="Close dialog"
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body / Message */}
            {message && (
              <div className="font-body text-sm text-on-surface-variant leading-relaxed">
                {typeof message === 'string' ? <p>{message}</p> : message}
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-surface-container-high/60">
              <button
                type="button"
                onClick={closeModal}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl border border-surface-container-high hover:bg-surface-container font-body text-xs uppercase tracking-wider font-semibold text-on-surface transition-colors cursor-pointer disabled:opacity-50"
              >
                {cancelText}
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isLoading}
                className={`px-6 py-2.5 rounded-xl font-body text-xs uppercase tracking-wider font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                  variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-primary hover:bg-neutral-800 text-on-primary'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{confirmText}</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default DynamicPopupModal;
