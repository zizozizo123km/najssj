import { useState } from 'react';
import { Image, Youtube, Send } from 'lucide-react';
import { motion } from 'motion/react';

interface CreatePostProps {
  onPost: (post: any) => void;
}

const SUBJECTS = [
  'رياضيات', 'فيزياء', 'لغة عربية', 'تاريخ وجغرافيا', 
  'تربية إسلامية', 'فلسفة', 'لغة ألمانية'
];

export default function CreatePost({ onPost }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onPost({
      id: Date.now(),
      author: 'أنت',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=you',
      content,
      image,
      youtubeUrl,
      subject,
      time: 'الآن',
      likes: 0,
      comments: [],
      liked: false,
      saved: false
    });

    setContent('');
    setImage('');
    setYoutubeUrl('');
    setShowYoutubeInput(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6"
    >
      <div className="flex gap-3 mb-4">
        <img 
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=you" 
          alt="Avatar" 
          className="w-10 h-10 rounded-full bg-gray-100"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="ماذا يدور في ذهنك بخصوص البكالوريا؟"
          className="flex-1 bg-gray-50 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[80px]"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              subject === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {showYoutubeInput && (
        <motion.input
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          type="text"
          placeholder="أدخل رابط يوتيوب هنا..."
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          className="w-full p-2 mb-4 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      )}

      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex gap-4">
          <button 
            onClick={() => setImage('https://picsum.photos/seed/' + Math.random() + '/600/400')}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <Image size={20} />
            <span className="hidden sm:inline text-sm">صورة</span>
          </button>
          <button 
            onClick={() => setShowYoutubeInput(!showYoutubeInput)}
            className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors"
          >
            <Youtube size={20} />
            <span className="hidden sm:inline text-sm">فيديو</span>
          </button>
        </div>
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <span>نشر</span>
          <Send size={18} />
        </button>
      </div>
    </motion.div>
  );
}
