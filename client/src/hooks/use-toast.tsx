import React, { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';

// Toast variants
type ToastVariant = 'default' | 'success' | 'warning' | 'destructive';

// Toast interface
interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

// Toast props
interface ToastProps extends Toast {
  onDismiss: (id: string) => void;
}

// Toast context type
interface ToastContextType {
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast component
const ToastComponent: React.FC<ToastProps> = ({ 
  id, 
  title, 
  description, 
  variant = 'default',
  onDismiss 
}) => {
  // Variant styles
  const variantStyles = {
    default: 'bg-white border-gray-200 text-gray-900',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    destructive: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div 
      className={`flex items-start shadow-md rounded-lg border p-4 mb-2 ${variantStyles[variant]}`}
      role="alert"
    >
      <div className="flex-1 mr-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        {description && <p className="text-sm mt-1">{description}</p>}
      </div>
      <button 
        type="button" 
        className="text-gray-400 hover:text-gray-500"
        onClick={() => onDismiss(id)}
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Toast provider component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (newToast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast = { ...newToast, id };
    setToasts(prevToasts => [...prevToasts, toast]);

    // Auto dismiss
    if (newToast.duration !== 0) {
      setTimeout(() => {
        dismissToast(id);
      }, newToast.duration || 5000);
    }
  };

  const dismissToast = (id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast, dismissToast, toasts }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-0 right-0 p-4 z-50 max-w-sm w-full">
        {toasts.map(toastItem => (
          <ToastComponent
            key={toastItem.id}
            {...toastItem}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Hook to use the toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// For direct imports in some files
export const toast = (props: Omit<Toast, 'id'>) => {
  const { toast: showToast } = useToast();
  return showToast(props);
};