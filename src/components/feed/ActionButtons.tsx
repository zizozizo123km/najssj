import { Heart, MessageCircle, Share2, Bookmark, Zap, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ActionButtonsProps {
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onAnalyze?: () => void;
  onTest?: () => void;
  type: 'video' | 'book' | 'post';
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export default function ActionButtons({ 
  onLike, onComment, onShare, onBookmark, onAnalyze, onTest, type,
  likesCount = 0, commentsCount = 0, isLiked = false, isBookmarked = false
}: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
      <div className="flex items-center gap-4">
        <button 
          onClick={onLike}
          className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'}`}
        >
          <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} />
          <span className="text-xs font-bold">{likesCount > 0 ? likesCount : ''}</span>
        </button>
        <button 
          onClick={onComment}
          className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
        >
          <MessageCircle size={22} />
          <span className="text-xs font-bold">{commentsCount > 0 ? commentsCount : ''}</span>
        </button>
        <button 
          onClick={onShare}
          className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors"
        >
          <Share2 size={22} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {type === 'video' && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onAnalyze}
            className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-black hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            <Zap size={14} fill="currentColor" />
            <span>تحليل بالذكاء الاصطناعي</span>
          </motion.button>
        )}
        {type === 'post' && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onTest}
            className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-lg text-xs font-black hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
          >
            <HelpCircle size={14} />
            <span>اختبرني</span>
          </motion.button>
        )}
        <button 
          onClick={onBookmark}
          className={`p-1.5 rounded-lg transition-colors ${isBookmarked ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
        >
          <Bookmark size={22} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  );
}
