import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, BookOpen, FileText, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import ActionButtons from './ActionButtons';

interface FeedCardProps {
  item: {
    id: string;
    type: 'video' | 'book' | 'post';
    title: string;
    content: string;
    author: string;
    authorId?: string;
    authorAvatar?: string;
    thumbnail?: string;
    date: string;
    tags?: string[];
  };
  onClick?: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export default function FeedCard({ item, onClick, onDelete, onEdit }: FeedCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100/50 hover:shadow-md transition-all active:scale-[0.98] group relative overflow-visible"
    >
      {/* Type Badge */}
      <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider z-10 flex items-center gap-1.5 shadow-sm ${
        item.type === 'video' ? 'bg-red-500 text-white' : 
        item.type === 'book' ? 'bg-blue-500 text-white' : 
        'bg-green-500 text-white'
      }`}>
        {item.type === 'video' ? <Play size={10} fill="currentColor" /> : 
         item.type === 'book' ? <BookOpen size={10} /> : 
         <FileText size={10} />}
        {item.type === 'video' ? 'فيديو' : item.type === 'book' ? 'كتاب' : 'منشور'}
      </div>

      {/* Author Info & Menu */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-gray-50 overflow-hidden shadow-sm">
            <img 
              src={item.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.author}`} 
              alt={item.author}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-900">{item.author}</h4>
            <p className="text-[10px] font-bold text-gray-400">{item.date}</p>
          </div>
        </div>

        {/* Options Menu */}
        {(onDelete || onEdit) && (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
            >
              <MoreVertical size={18} />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute left-0 top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20"
                  >
                    {onEdit && (
                      <button 
                        onClick={() => { setShowMenu(false); onEdit(item.id); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Edit2 size={14} />
                        <span className="font-bold">تعديل</span>
                      </button>
                    )}
                    {onDelete && (
                      <button 
                        onClick={() => { setShowMenu(false); onDelete(item.id); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                        <span className="font-bold">حذف</span>
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Content */}
      <div onClick={onClick} className="cursor-pointer space-y-3">
        <h3 className="text-lg font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
          {item.title}
        </h3>
        
        {item.thumbnail && (
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 shadow-inner group-hover:shadow-lg transition-all">
            <img 
              src={item.thumbnail} 
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            {item.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl scale-90 group-hover:scale-100 transition-transform">
                  <Play size={24} className="text-red-600 ml-1" fill="currentColor" />
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 font-medium">
          {item.content}
        </p>

        {item.tags && (
          <div className="flex flex-wrap gap-2 mt-2">
            {item.tags.map(tag => (
              <span key={tag} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <ActionButtons 
        type={item.type}
        onAnalyze={() => console.log('Analyze', item.id)}
        onTest={() => console.log('Test', item.id)}
      />
    </motion.div>
  );
}
