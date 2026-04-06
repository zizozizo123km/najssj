import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, ExternalLink, Pin, Trash2, UserMinus, Edit2, Smile, MoreVertical } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { auth, db, doc, updateDoc } from '../lib/firebase';

import { UserProfile, Message, Group } from '../types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isModerator?: boolean;
  onDelete?: (id: string) => void;
  onPin?: (id: string) => void;
  onRemoveUser?: (userId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  isModerator,
  onDelete,
  onPin,
  onRemoveUser,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAI = message.type === 'ai';
  const date = message.createdAt?.toDate ? message.createdAt.toDate() : new Date();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEdit = async () => {
    try {
      await updateDoc(doc(db, 'chat_messages', message.id), { text: editText });
      setIsEditing(false);
      setShowMenu(false);
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const handleReact = async (emoji: string) => {
    try {
      const reactions = message.reactions || {};
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userReaction = reactions[userId];
      if (userReaction === emoji) {
        delete reactions[userId];
      } else {
        reactions[userId] = emoji;
      }
      await updateDoc(doc(db, 'chat_messages', message.id), { reactions });
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex w-full mb-4 group",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex max-w-[85%] sm:max-w-[70%]",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}>
        {!isAI && (
          <img
            src={message.senderPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderName}`}
            alt={message.senderName}
            className={cn(
              "w-8 h-8 rounded-full mt-auto mb-1 flex-shrink-0 border border-slate-200 dark:border-slate-700",
              isOwn ? "ml-2" : "mr-2"
            )}
          />
        )}

        <div className={cn(
          "flex flex-col",
          isOwn ? "items-end" : "items-start"
        )}>
          {!isAI && (
            <div className={cn(
              "flex items-center gap-1.5 mb-1",
              isOwn ? "mr-1" : "ml-1"
            )}>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {message.senderName}
              </span>
              {isModerator && (
                <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 text-[8px] px-1.5 py-0.5 rounded-full font-black border border-indigo-100 dark:border-indigo-900/50 uppercase tracking-tighter">مشرف</span>
              )}
            </div>
          )}

          <div className={cn(
            "relative px-4 py-2.5 rounded-2xl shadow-sm",
            isOwn 
              ? "bg-indigo-600 text-white rounded-tr-none" 
              : isAI 
                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-indigo-200 dark:border-indigo-900/50 rounded-tl-none"
                : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-tl-none"
          )}>
            {message.isPinned && (
              <div className="flex items-center gap-1 text-[10px] opacity-70 mb-1">
                <Pin className="w-3 h-3 rotate-45" />
                <span>Pinned</span>
              </div>
            )}

            {isEditing ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="text-sm text-slate-900 p-2 rounded-lg"
                />
                <button onClick={handleEdit} className="text-xs bg-white text-indigo-600 px-2 py-1 rounded">حفظ</button>
              </div>
            ) : (
              <div className={cn(
                "text-sm leading-relaxed whitespace-pre-wrap break-words",
                isAI && "font-medium italic"
              )}>
                {isAI && <span className="mr-1">🤖</span>}
                {message.type === 'image' && message.fileUrl ? (
                  <img src={message.fileUrl} alt="Message attachment" className="max-w-full rounded-lg mb-2" referrerPolicy="no-referrer" />
                ) : null}
                {message.text && <p>{message.text}</p>}
              </div>
            )}

            <div className="flex gap-1 mt-1">
              {['👍', '❤️', '😂'].map(emoji => (
                <button key={emoji} onClick={() => handleReact(emoji)} className="text-xs hover:bg-black/10 p-0.5 rounded">
                  {emoji}
                </button>
              ))}
            </div>

            <div className={cn(
              "text-[10px] mt-1 opacity-60 flex items-center gap-1",
              isOwn ? "justify-end" : "justify-start"
            )}>
              {formatDate(date)}
            </div>

            {/* Menu Actions */}
            {!isAI && (isOwn || isModerator) && (
              <div className={cn(
                "absolute top-0 flex items-center",
                isOwn ? "right-full mr-2" : "left-full ml-2"
              )} ref={menuRef}>
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 rounded-full hover:text-slate-600 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                
                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute top-full mt-1 w-32 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 rounded-xl py-1 z-50"
                    >
                      {isOwn && (
                        <button 
                          onClick={() => { setIsEditing(true); setShowMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> تعديل
                        </button>
                      )}
                      <button 
                        onClick={() => { onDelete?.(message.id); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> حذف
                      </button>
                      {isModerator && (
                        <>
                          <button 
                            onClick={() => { onPin?.(message.id); setShowMenu(false); }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                          >
                            <Pin className="w-3.5 h-3.5" /> تثبيت
                          </button>
                          {!isOwn && (
                            <button 
                              onClick={() => { onRemoveUser?.(message.senderId); setShowMenu(false); }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            >
                              <UserMinus className="w-3.5 h-3.5" /> إزالة
                            </button>
                          )}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
