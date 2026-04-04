import { Users, Activity, Bell, Server } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: 'users' | 'activity' | 'bell' | 'server';
  color: 'blue' | 'green' | 'purple' | 'orange';
}

export default function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const icons = {
    users: Users,
    activity: Activity,
    bell: Bell,
    server: Server,
  };
  
  const colors = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    purple: 'bg-purple-500/10 text-purple-500',
    orange: 'bg-orange-500/10 text-orange-500',
  };

  const Icon = icons[icon];

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 flex items-center gap-4">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-gray-400 text-sm font-bold">{title}</p>
        <h3 className="text-2xl font-black text-white mt-1">{value}</h3>
      </div>
    </div>
  );
}
