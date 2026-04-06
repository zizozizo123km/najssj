import React from 'react';
import { Home as HomeIcon, Calendar, PlayCircle, BookOpen, LayoutGrid, User, Sparkles, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

interface PlaceholderPageProps {
  title: string;
  icon: React.ElementType;
  description: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, icon: Icon, description }) => (
  <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
    <header className="px-6 py-8 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
            <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{description}</p>
      </div>
    </header>
    
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full flex flex-col items-center justify-center text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-12 bg-white dark:bg-gray-900 rounded-[3rem] shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-6"
      >
        <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center shadow-inner">
          <Icon className="w-12 h-12 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Coming Soon!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs leading-relaxed">
            We are working hard to bring you the best {title.toLowerCase()} experience for your Baccalaureate preparation.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-500/20">
          <Sparkles className="w-3 h-3" />
          Stay Tuned
        </div>
      </motion.div>
      
      <div className="mt-12 flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest font-black">
        <GraduationCap className="w-4 h-4" />
        Bac DZ AI Platform
      </div>
    </main>
  </div>
);

export const Home: React.FC = () => <PlaceholderPage title="Home" icon={HomeIcon} description="Your personalized study dashboard." />;
export const Planner: React.FC = () => <PlaceholderPage title="Planner" icon={Calendar} description="Manage your study schedule and tasks." />;
export const Videos: React.FC = () => <PlaceholderPage title="Videos" icon={PlayCircle} description="Watch high-quality educational videos." />;
export const Library: React.FC = () => <PlaceholderPage title="Library" icon={BookOpen} description="Access a wide range of study materials and PDFs." />;
export const Quiz: React.FC = () => <PlaceholderPage title="Quiz" icon={LayoutGrid} description="Test your knowledge with interactive quizzes." />;
export const Profile: React.FC = () => <PlaceholderPage title="Profile" icon={User} description="Manage your account and academic settings." />;
