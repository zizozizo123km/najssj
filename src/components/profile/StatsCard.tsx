import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  delay?: number;
}

export default function StatsCard({ label, value, icon: Icon, color, delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center space-y-3 group hover:shadow-xl transition-all"
    >
      <div className={`p-4 rounded-full ${color} bg-opacity-10 dark:bg-opacity-20 text-opacity-100 transition-transform group-hover:scale-110`}>
        <Icon size={28} className={color.replace('bg-', 'text-')} />
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-black text-gray-900 dark:text-white">{value}</h3>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      </div>
    </motion.div>
  );
}
