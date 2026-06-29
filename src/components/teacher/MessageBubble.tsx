import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Bot, Save, Volume2, Square, Loader2 } from 'lucide-react';
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
  autoPlay?: boolean;
}

export default function MessageBubble({ message, onSave, autoPlay }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Trigger auto-play if requested on mount
  useEffect(() => {
    if (autoPlay && !isUser) {
      const timer = setTimeout(() => {
        toggleSpeech();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay]);

  const toggleSpeech = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    setLoadingAudio(true);
    try {
      // Strips markdown from text to make speech clear and pleasant
      const cleanText = message.text
        .replace(/[*#`_~\[\]()\-+]/g, '')
        .replace(/:\s*all/g, '')
        .trim();

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: cleanText,
          voice: 'kore' 
        }),
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const data = await response.json();
      if (data.audio) {
        const audioUrl = `data:audio/mp3;base64,${data.audio}`;
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsPlaying(false);
        };
        
        audio.onerror = () => {
          setIsPlaying(false);
        };

        setIsPlaying(true);
        await audio.play();
      } else {
        throw new Error('No audio data received');
      }
    } catch (err) {
      console.error('Error playing voice via backend:', err);
      // Local fallback to browser speech synthesis
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(message.text.replace(/[*#`_~\[\]()\-+]/g, ''));
          utterance.lang = 'ar-SA';
          utterance.onend = () => setIsPlaying(false);
          utterance.onerror = () => setIsPlaying(false);
          setIsPlaying(true);
          window.speechSynthesis.speak(utterance);
        }
      } catch (fallbackErr) {
        console.error('Fallback speech synthesis failed:', fallbackErr);
      }
    } finally {
      setLoadingAudio(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-3 mb-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${isUser ? 'bg-blue-600 text-white' : 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-black'}`}>
        {isUser ? <User size={18} /> : 'أ'}
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
            <ReactMarkdown>
              {typeof message.text === 'string'
                ? message.text
                : typeof message.text === 'object' && message.text !== null
                  ? JSON.stringify(message.text)
                  : String(message.text || '')}
            </ReactMarkdown>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mt-1 px-1">
          {!isUser && (
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSpeech}
                disabled={loadingAudio}
                className={`text-[10px] flex items-center gap-1 font-bold transition-all px-2 py-0.5 rounded-full ${
                  isPlaying 
                    ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 animate-pulse' 
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 hover:bg-emerald-100'
                }`}
              >
                {loadingAudio ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    جاري توليد الصوت...
                  </>
                ) : isPlaying ? (
                  <>
                    <Square size={12} />
                    إيقاف الأستاذ
                  </>
                ) : (
                  <>
                    <Volume2 size={12} />
                    استمع للأستاذ
                  </>
                )}
              </button>

              {onSave && (
                <button
                  onClick={() => onSave(message.text)}
                  className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline font-bold transition-colors"
                >
                  <Save size={12} />
                  حفظ كملخص دراسي
                </button>
              )}
            </div>
          )}
          <span className="text-[10px] text-gray-400">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
