import React from 'react';
import { ArrowLeft, Users, Info, MoreVertical } from 'lucide-react';

import { Group } from '../types';

interface ChatHeaderProps {
  group: Group;
  onlineCount: number;
  onBack?: () => void;
  onInfo?: () => void;
  onToggleSidebar?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  group,
  onlineCount,
  onBack,
  onInfo,
  onToggleSidebar,
}) => {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
            {group.name}
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{onlineCount} students online</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors md:hidden"
        >
          <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <button
          onClick={onInfo}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <Info className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
      </div>
    </header>
  );
};
