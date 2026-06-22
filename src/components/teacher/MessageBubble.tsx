import { motion } from 'motion/react';
import { User, Bot, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
  onSave?: (text: string) => void;
}

export default function MessageBubble({ message, onSave }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-3 mb-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${isUser ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'}`}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>
      
      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`p-4 rounded-2xl shadow-sm border ${
          isUser 
            ? 'bg-blue-600 text-white rounded-tr-none border-blue-500 shadow-md shadow-blue-600/10' 
            : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-tl-none border-gray-100 dark:border-gray-800'
        }`}>
          {message.image && (
            <img 
               src={message.image} 
              alt="Uploaded exercise" 
              className="max-w-full rounded-lg mb-3 border border-gray-200"
              referrerPolicy="no-referrer"
            />
          )}
          <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-slate'}`}>
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mt-1 px-1">
          {!isUser && onSave && (
            <button
              onClick={() => onSave(message.text)}
              className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline font-bold transition-colors"
            >
              <Save size={12} />
              حفظ كملخص دراسي
            </button>
          )}
          <span className="text-[10px] text-gray-400">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
