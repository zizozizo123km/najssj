import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, ExternalLink, Pin, Trash2, UserMinus, Edit2, Smile, MoreVertical } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { auth, db, doc, updateDoc, handleFirestoreError, OperationType, deleteField, getDoc } from '../lib/firebase';

import { UserProfile, Message, Group } from '../types';
import ProfilePreview from './profile/ProfilePreview';

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
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showProfilePreview, setShowProfilePreview] = useState(false);
  const [senderPhoto, setSenderPhoto] = useState(message.senderPhoto);
  const menuRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const isAI = message.type === 'ai';
  const date = message.createdAt?.toDate ? message.createdAt.toDate() : new Date();

  useEffect(() => {
    const fetchSenderPhoto = async () => {
      if (message.senderId && message.senderId !== 'ai-assistant') {
        const profileDoc = await getDoc(doc(db, 'profiles', message.senderId));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          if (data.avatar_url) {
            setSenderPhoto(data.avatar_url);
          }
        }
      }
    };
    fetchSenderPhoto();
  }, [message.senderId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (bubbleRef.current && !bubbleRef.current.contains(event.target as Node)) {
        setShowReactionPicker(false);
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
      handleFirestoreError(error, OperationType.UPDATE, `chat_messages/${message.id}`);
    }
  };

  const handleReact = async (emoji: string) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const reactions = message.reactions || {};
      const userReaction = reactions[userId];
      
      if (userReaction === emoji) {
        // Remove reaction using dot notation
        await updateDoc(doc(db, 'chat_messages', message.id), {
          [`reactions.${userId}`]: deleteField()
        });
      } else {
        // Add/Update reaction using dot notation
        await updateDoc(doc(db, 'chat_messages', message.id), {
          [`reactions.${userId}`]: emoji
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chat_messages/${message.id}`);
    }
  };

  // Group reactions
  const reactionCounts = message.reactions 
    ? Object.values(message.reactions).reduce((acc, emoji) => {
        acc[emoji] = (acc[emoji] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex w-full mb-6 group",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex max-w-[85%] sm:max-w-[70%]",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}>
        {!isAI && (
          <img
            src={senderPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderName}`}
            alt={message.senderName}
            onClick={() => setShowProfilePreview(true)}
            className={cn(
              "w-8 h-8 rounded-full mt-auto mb-1 flex-shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all",
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
              <span 
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors"
                onClick={() => setShowProfilePreview(true)}
              >
                {message.senderName}
              </span>
              {isModerator && (
                <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 text-[8px] px-1.5 py-0.5 rounded-full font-black border border-indigo-100 dark:border-indigo-900/50 uppercase tracking-tighter">مشرف</span>
              )}
            </div>
          )}

          <div 
            ref={bubbleRef}
            onClick={() => !isAI && setShowReactionPicker(!showReactionPicker)}
            className={cn(
              "relative px-4 py-2.5 rounded-2xl shadow-sm cursor-pointer transition-all",
              isOwn 
                ? "bg-indigo-600 text-white rounded-tr-none" 
                : isAI 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-indigo-200 dark:border-indigo-900/50 rounded-tl-none"
                  : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-tl-none"
            )}
          >
            <AnimatePresence>
              {showReactionPicker && (
                <motion.div 
                  initial={{ opacity: 0, y: 5, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.9 }}
                  className={cn(
                    "absolute -top-12 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 rounded-full px-2 py-1 flex gap-1 z-50",
                    isOwn ? "right-0" : "left-0"
                  )}
                >
                  {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                    <button 
                      key={emoji} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReact(emoji);
                        setShowReactionPicker(false);
                      }} 
                      className="text-lg hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-full transition-transform hover:scale-125 active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

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
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm text-slate-900 p-2 rounded-lg"
                />
                <button onClick={(e) => { e.stopPropagation(); handleEdit(); }} className="text-xs bg-white text-indigo-600 px-2 py-1 rounded font-bold">حفظ</button>
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

            <div className={cn(
              "text-[10px] mt-1 opacity-60 flex items-center gap-1",
              isOwn ? "justify-end" : "justify-start"
            )}>
              {formatDate(date)}
            </div>

            {/* Display existing reactions */}
            {Object.keys(reactionCounts).length > 0 && (
              <div className={cn(
                "absolute -bottom-3.5 flex gap-1 z-10",
                isOwn ? "right-2" : "left-2"
              )}>
                {Object.entries(reactionCounts).map(([emoji, count]) => (
                  <div 
                    key={emoji} 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReact(emoji);
                    }}
                    className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-full px-1.5 py-0.5 text-[10px] flex items-center gap-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span>{emoji}</span>
                    <span className="font-bold text-slate-500 dark:text-slate-400">{count}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Menu Actions */}
            {!isAI && (isOwn || isModerator) && (
              <div className={cn(
                "absolute top-0 flex items-center",
                isOwn ? "right-full mr-2" : "left-full ml-2"
              )} ref={menuRef}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="p-1.5 bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 rounded-full hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
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
                          onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> تعديل
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete?.(message.id); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> حذف
                      </button>
                      {isModerator && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onPin?.(message.id); setShowMenu(false); }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                          >
                            <Pin className="w-3.5 h-3.5" /> تثبيت
                          </button>
                          {!isOwn && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onRemoveUser?.(message.senderId); setShowMenu(false); }}
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
      <ProfilePreview 
        userId={message.senderId} 
        isOpen={showProfilePreview} 
        onClose={() => setShowProfilePreview(false)} 
      />
    </motion.div>
  );
};
