import { User, Mail, GraduationCap, BookOpen, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';
import { BAC_BRANCHES } from '../../data/baccalaureate';

interface ProfileHeaderProps {
  user: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    branch: string;
    favoriteSubjects: string[];
  };
  onEdit: () => void;
}

export default function ProfileHeader({ user, onEdit }: ProfileHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
    >
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative group">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-blue-50 shadow-inner">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'Profile'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                <User size={48} />
              </div>
            )}
          </div>
          <button 
            onClick={onEdit}
            className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-transform hover:scale-110"
          >
            <Edit2 size={16} />
          </button>
        </div>

        <div className="flex-1 text-center md:text-right space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">{user.displayName || 'مستخدم جديد'}</h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              <Mail size={14} className="text-blue-500" /> {user.email}
            </span>
            <span className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              <GraduationCap size={14} className="text-purple-500" /> {BAC_BRANCHES.find(b => b.id === user.branch)?.name || user.branch}
            </span>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
            {user.favoriteSubjects.map((subject) => (
              <span key={subject} className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                <BookOpen size={12} /> {subject}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
