import React, { useState, useRef } from 'react';
import { Image as ImageIcon, FileText, Send, Paperclip, Youtube, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { uploadFile } from '../services/uploadService';

interface MessageInputProps {
  onSendMessage: (text: string, type: 'text' | 'image' | 'pdf' | 'youtube') => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled }) => {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || disabled) return;

    // YouTube link detection
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/;
    const match = text.match(youtubeRegex);
    
    if (match && match[1]) {
      onSendMessage(text, 'youtube');
    } else {
      onSendMessage(text, 'text');
    }
    
    setText('');
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const type = file.type.includes('image') ? 'image' : 'pdf';
      
      if (type === 'image') {
        const imageUrl = await uploadFile(file, 'image');
        onSendMessage(imageUrl, 'image');
      } else {
        // For PDF, we might need a different upload logic or just simulate it for now if Cloudinary doesn't support PDF easily with the same preset
        // Assuming the user only wants images for now based on the request
        onSendMessage(`أرسل ملف: ${file.name}`, 'pdf');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('حدث خطأ أثناء رفع الملف. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-8 relative">
      <form onSubmit={handleSend} className="flex items-end gap-3 max-w-5xl mx-auto">
        <div className="flex items-center gap-1 mb-1">
          <button
            type="button"
            onClick={handleFileClick}
            className="p-2.5 text-slate-500 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90"
            title="Attach file"
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,.pdf"
          />
        </div>

        <div className="flex-1 relative">
          <textarea
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={disabled ? "هذه الغرفة مغلقة حالياً" : "اكتب رسالتك هنا..."}
            disabled={disabled}
            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none max-h-32 text-sm border-none"
          />
          {text.includes('youtube.com') && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 animate-pulse">
              <Youtube size={16} />
            </div>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!text.trim() || disabled || isUploading}
          className="mb-1 p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </form>
      
      <div className="flex gap-4 mt-2 px-2 max-w-5xl mx-auto">
        <button 
          type="button" 
          onClick={handleFileClick}
          className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold hover:text-indigo-500 transition-colors"
          disabled={isUploading}
        >
          <ImageIcon size={12} className="text-blue-500" />
          صورة
        </button>
        <button 
          type="button" 
          onClick={handleFileClick}
          className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold hover:text-indigo-500 transition-colors"
          disabled={isUploading}
        >
          <FileText size={12} className="text-red-500" />
          ملف PDF
        </button>
      </div>
    </div>
  );
};
