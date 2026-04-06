import React from 'react';
import { X, Shield, User, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { UserProfile } from '../types';

interface OnlineMembersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  members: UserProfile[];
}

export const OnlineMembersPanel: React.FC<OnlineMembersPanelProps> = ({
  isOpen,
  onClose,
  members,
}) => {
  // Consider online if lastSeen is within the last 5 minutes
  const isOnline = (m: UserProfile) => {
    if (!m.lastSeen) return false;
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return m.lastSeen.toMillis() > fiveMinutesAgo;
  };

  const onlineMembers = members.filter(isOnline);
  const offlineMembers = members.filter(m => !isOnline(m));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          />
          
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 flex flex-col shadow-2xl"
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white">Group Members</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Online Section */}
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  Online — {onlineMembers.length}
                </h3>
                <div className="space-y-3">
                  {onlineMembers.map(member => (
                    <MemberItem key={member.uid} member={member} />
                  ))}
                </div>
              </section>

              {/* Offline Section */}
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  Offline — {offlineMembers.length}
                </h3>
                <div className="space-y-3 opacity-60">
                  {offlineMembers.map(member => (
                    <MemberItem key={member.uid} member={member} />
                  ))}
                </div>
              </section>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-center text-slate-500">
                Total Members: {members.length}
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

const MemberItem = ({ member }: { member: UserProfile }) => {
  const isOnline = (m: UserProfile) => {
    if (!m.lastSeen) return false;
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return m.lastSeen.toMillis() > fiveMinutesAgo;
  };

  const online = isOnline(member);

  return (
    <div className="flex items-center gap-3 group">
      <div className="relative">
        <img
          src={member.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.displayName}`}
          alt={member.displayName}
          className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700"
        />
        {online && (
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {member.displayName}
          </p>
          {member.role === 'teacher' && (
            <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded uppercase">
              Teacher
            </span>
          )}
          {member.role === 'admin' && (
            <Shield className="w-3 h-3 text-amber-500" />
          )}
        </div>
        <p className="text-[10px] text-slate-500 truncate">
          {online ? 'Active now' : 'Last seen recently'}
        </p>
      </div>
    </div>
  );
};
