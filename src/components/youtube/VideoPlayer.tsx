import { motion } from 'motion/react';

interface VideoPlayerProps {
  videoId: string;
  title: string;
}

export default function VideoPlayer({ videoId, title }: VideoPlayerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800"
    >
      <div className="aspect-video bg-black">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      <div className="p-4 bg-white dark:bg-gray-900">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{title}</h2>
      </div>
    </motion.div>
  );
}
