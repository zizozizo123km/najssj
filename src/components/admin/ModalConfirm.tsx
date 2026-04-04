import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface ModalConfirmProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ModalConfirm({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  type = 'danger'
}: ModalConfirmProps) {
  const colors = {
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-orange-500 hover:bg-orange-600 text-white',
    info: 'bg-blue-500 hover:bg-blue-600 text-white',
  };

  const iconColors = {
    danger: 'bg-red-500/10 text-red-500',
    warning: 'bg-orange-500/10 text-orange-500',
    info: 'bg-blue-500/10 text-blue-500',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-gray-800 border border-gray-700 rounded-3xl p-6 z-[110] shadow-2xl font-sans dir-rtl"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${iconColors[type]}`}>
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-white">{title}</h3>
              <p className="text-sm text-gray-400 font-medium pb-4">
                {message}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 bg-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-600 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onCancel();
                  }}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors ${colors[type]}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
