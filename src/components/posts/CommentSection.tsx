import { useState } from 'react';
import { Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ProfilePreview from '../profile/ProfilePreview';

interface CommentSectionProps {
  comments: any[];
  onAddComment: (text: string) => void;
}

export default function CommentSection({ comments, onAddComment }: CommentSectionProps) {
  const [text, setText] = useState('');
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment(text);
    setText('');
  };

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-gray-50 border-t border-gray-100 p-4"
    >
      <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 items-start">
            <img 
              src={comment.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author}`} 
              alt={comment.author} 
              onClick={() => comment.userId && setPreviewUserId(comment.userId)}
              className="w-8 h-8 rounded-full bg-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
            />
            <div className="flex-1 bg-white p-3 rounded-2xl rounded-tr-none shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <span 
                  className="font-bold text-xs text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => comment.userId && setPreviewUserId(comment.userId)}
                >
                  {comment.author}
                </span>
                <span className="text-[10px] text-gray-400">{comment.time}</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 items-center bg-white p-1 rounded-full border border-gray-200 shadow-sm">
        <input 
          type="text" 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب تعليقاً..." 
          className="flex-1 bg-transparent px-4 py-2 text-xs focus:outline-none"
        />
        <button 
          type="submit"
          disabled={!text.trim()}
          className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Send size={16} />
        </button>
      </form>

      <ProfilePreview 
        userId={previewUserId || ''} 
        isOpen={!!previewUserId} 
        onClose={() => setPreviewUserId(null)} 
      />
    </motion.div>
  );
}
