import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface ProgressCardProps {
  label: string;
  current: number;
  total: number;
  icon: LucideIcon;
  color: string;
  delay?: number;
}

export default function ProgressCard({ label, current, total, icon: Icon, color, delay = 0 }: ProgressCardProps) {
  const percentage = isNaN(current) || isNaN(total) || total === 0 
    ? 0 
    : Math.min(100, Math.round((current / total) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 space-y-4 hover:shadow-xl transition-all"
    >
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
        <span className="text-xl font-black text-gray-900">{percentage}%</span>
      </div>
      
      <div className="space-y-1">
        <h3 className="font-bold text-gray-900">{label}</h3>
        <p className="text-xs font-bold text-gray-500">{current} من {total} مكتمل</p>
      </div>

      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: delay + 0.2, duration: 0.8 }}
          className={`h-full ${color.replace('bg-', 'bg-')}`}
        />
      </div>
    </motion.div>
  );
}
