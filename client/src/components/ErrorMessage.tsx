import { motion } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  const { setError } = useGameStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="max-w-md w-full">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="bg-red-900/20 border border-red-500 rounded-lg p-6"
        >
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-red-400 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-400 mb-2">
                Error
              </h3>
              <p className="text-gray-300 mb-4">
                {message}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setError(null)}
                  className="btn-secondary text-sm"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary text-sm"
                >
                  Reload Page
                </button>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
