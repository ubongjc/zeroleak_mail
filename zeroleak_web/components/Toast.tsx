/**
 * Toast Notification Component
 * Beautiful notifications for success, error, info, and warning messages
 */

'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    duration: number = 5000
  ) => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, type, title, message, duration };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const success = useCallback((title: string, message?: string) => {
    showToast('success', title, message);
  }, [showToast]);

  const error = useCallback((title: string, message?: string) => {
    showToast('error', title, message, 7000); // Longer duration for errors
  }, [showToast]);

  const info = useCallback((title: string, message?: string) => {
    showToast('info', title, message);
  }, [showToast]);

  const warning = useCallback((title: string, message?: string) => {
    showToast('warning', title, message);
  }, [showToast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const config = {
    success: {
      icon: '✓',
      gradient: 'from-green-500 to-emerald-600',
      bg: 'bg-white',
      border: 'border-green-200',
      iconBg: 'bg-green-100',
      iconText: 'text-green-600',
    },
    error: {
      icon: '✗',
      gradient: 'from-red-500 to-pink-600',
      bg: 'bg-white',
      border: 'border-red-200',
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
    },
    info: {
      icon: 'ℹ',
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-white',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
    },
    warning: {
      icon: '⚠',
      gradient: 'from-yellow-500 to-orange-600',
      bg: 'bg-white',
      border: 'border-yellow-200',
      iconBg: 'bg-yellow-100',
      iconText: 'text-yellow-600',
    },
  };

  const style = config[toast.type];

  return (
    <div
      className={`${style.bg} ${style.border} border-2 rounded-xl shadow-2xl p-4 min-w-[320px] max-w-md pointer-events-auto animate-slideIn`}
    >
      <div className="flex items-start space-x-3">
        <div className={`${style.iconBg} ${style.iconText} rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0`}>
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-gray-900 mb-1`}>{toast.title}</h4>
          {toast.message && (
            <p className="text-sm text-gray-600">{toast.message}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
