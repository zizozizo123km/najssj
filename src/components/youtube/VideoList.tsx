import { Play, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

interface VideoListProps {
  videos: Video[];
  onSelect: (video: Video) => void;
  selectedId?: string;
}

export default function VideoList({ videos, onSelect, selectedId }: VideoListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((video) => (
        <motion.div
          key={video.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(video)}
          className={`cursor-pointer bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border-2 transition-all ${
            selectedId === video.id ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
          }`}
        >
          <div className="relative aspect-video">
            <img 
              src={video.thumbnail} 
              alt={video.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div className="bg-white/90 dark:bg-gray-900/90 p-2 rounded-full">
                <Play size={20} className="text-blue-600 dark:text-blue-400 fill-current" />
              </div>
            </div>
          </div>
          <div className="p-3">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">{video.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{video.channelTitle}</p>
            <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
              <Clock size={10} />
              <span>{new Date(video.publishedAt).toLocaleDateString('ar-DZ')}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
