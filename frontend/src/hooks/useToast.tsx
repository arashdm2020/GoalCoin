'use client';

import { useState, useCallback, ReactElement } from 'react';
import Toast, { ToastType } from '../components/Toast';

interface ToastState {
  message: string;
  type: ToastType;
  isVisible: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type, isVisible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  const showSuccess = useCallback((message: string) => {
    setToast({ message, type: 'success', isVisible: true });
  }, []);

  const showError = useCallback((message: string) => {
    setToast({ message, type: 'error', isVisible: true });
  }, []);

  const showWarning = useCallback((message: string) => {
    setToast({ message, type: 'warning', isVisible: true });
  }, []);

  const showInfo = useCallback((message: string) => {
    setToast({ message, type: 'info', isVisible: true });
  }, []);

  const ToastComponent = toast.isVisible ? (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={hideToast}
    />
  ) : null;

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    ToastComponent,
  } as const;
}
