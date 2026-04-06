import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface AIHelpButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

export const AIHelpButton: React.FC<AIHelpButtonProps> = ({ onClick, isLoading }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={isLoading}
      className="fixed bottom-24 right-6 z-20 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all border border-white/20"
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <Bot className="w-5 h-5" />
      )}
      <span className="font-bold text-sm">Ask AI 🤖</span>
      <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
    </motion.button>
  );
};
