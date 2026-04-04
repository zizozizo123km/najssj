import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium"
      dir="rtl"
    >
      <AlertCircle size={18} className="shrink-0" />
      <span>{message}</span>
    </motion.div>
  );
}
