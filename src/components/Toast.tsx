import { useEffect, useState } from 'react';
import { CheckCircle, X, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const bgColor = toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  const Icon = toast.type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px] max-w-md animate-slide-in`}>
      <Icon size={20} />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button onClick={() => onClose(toast.id)} className="p-1 hover:bg-white/20 rounded">
        <X size={16} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-20 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}

let toastListeners: ((toasts: ToastMessage[]) => void)[] = [];
let toastQueue: ToastMessage[] = [];

export function showToast(message: string, type: ToastType = 'success') {
  const id = Date.now().toString() + Math.random().toString(36);
  const toast: ToastMessage = { id, message, type };
  toastQueue = [...toastQueue, toast];
  toastListeners.forEach(listener => listener(toastQueue));

  setTimeout(() => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    toastListeners.forEach(listener => listener(toastQueue));
  }, 3000);
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter(listener => listener !== setToasts);
    };
  }, []);

  const removeToast = (id: string) => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    toastListeners.forEach(listener => listener(toastQueue));
  };

  return { toasts, removeToast };
}
