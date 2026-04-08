import { motion, AnimatePresence } from 'motion/react';
import { Play, HelpCircle, FileText, Bookmark, Calendar, ChevronRight } from 'lucide-react';

interface Activity {
  id: string;
  type: 'video' | 'quiz' | 'post' | 'summary';
  title: string;
  date: string;
  score?: string | number;
}

interface ActivityListProps {
  activities: Activity[];
}

export default function ActivityList({ activities }: ActivityListProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play size={18} className="text-red-500" />;
      case 'quiz': return <HelpCircle size={18} className="text-orange-500" />;
      case 'post': return <FileText size={18} className="text-blue-500" />;
      case 'summary': return <Bookmark size={18} className="text-green-500" />;
      default: return <FileText size={18} />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800 space-y-6 transition-colors">
      <div className="flex items-center justify-between border-b dark:border-gray-800 pb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">نشاطاتي الأخيرة</h2>
        <button className="text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline">عرض الكل</button>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {activities.map((activity, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group cursor-pointer"
            >
              <div className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm group-hover:scale-110 transition-transform">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{activity.title}</h4>
                <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar size={10} /> {activity.date}
                  </span>
                  {activity.score && (
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">
                      النتيجة: {activity.score}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
