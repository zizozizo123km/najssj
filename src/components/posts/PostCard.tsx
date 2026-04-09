import { useState } from 'react';
import { ThumbsUp, MessageSquare, Share2, Bookmark, MoreHorizontal, Globe, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CommentSection from './CommentSection';
import ProfilePreview from '../profile/ProfilePreview';

interface PostCardProps {
  post: any;
  onLike: (id: number) => void;
  onSave: (id: number) => void;
  onAddComment: (id: number, text: string) => void;
}

export default function PostCard({ post, onLike, onSave, onAddComment }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = post.youtubeUrl ? extractVideoId(post.youtubeUrl) : null;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={post.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author}`} 
            alt={post.author} 
            onClick={() => post.authorId && setPreviewUserId(post.authorId)}
            className="w-10 h-10 rounded-full bg-gray-100 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
          />
          <div className="cursor-pointer" onClick={() => post.authorId && setPreviewUserId(post.authorId)}>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 hover:text-blue-600 transition-colors">{post.author}</h3>
              <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {post.subject}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <span>{post.time}</span>
              <Globe size={10} />
            </div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={20} /></button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Media */}
      {post.image && (
        <div className="relative aspect-video overflow-hidden bg-gray-100">
          <img 
            src={post.image} 
            alt="Post content" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {videoId && (
        <div className="aspect-video bg-black">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-2 flex items-center justify-between border-t border-gray-50">
        <div className="flex gap-4">
          <button 
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-1.5 transition-colors ${post.liked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
          >
            <ThumbsUp size={20} className={post.liked ? 'fill-current' : ''} />
            <span className="text-xs font-bold">{post.likes}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <MessageSquare size={20} />
            <span className="text-xs font-bold">{post.comments.length}</span>
          </button>
          <button className="text-gray-500 hover:text-blue-600 transition-colors">
            <Share2 size={20} />
          </button>
        </div>
        <button 
          onClick={() => onSave(post.id)}
          className={`transition-colors ${post.saved ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'}`}
        >
          <Bookmark size={20} className={post.saved ? 'fill-current' : ''} />
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <CommentSection 
            comments={post.comments} 
            onAddComment={(text) => onAddComment(post.id, text)} 
          />
        )}
      </AnimatePresence>

      <ProfilePreview 
        userId={previewUserId || ''} 
        isOpen={!!previewUserId} 
        onClose={() => setPreviewUserId(null)} 
      />
    </motion.div>
  );
}
