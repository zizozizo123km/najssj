import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import OAuthButtons from '../components/auth/OAuthButtons';
import ErrorMessage from '../components/auth/ErrorMessage';
import { GraduationCap, Sparkles, BookOpen, Brain, Target } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLoginSuccess = () => {
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FF] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900" dir="rtl">
      {/* Soft Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[100px]" />
      <div className="absolute top-[20%] right-[15%] w-4 h-4 bg-blue-200 rounded-full" />
      <div className="absolute bottom-[30%] left-[10%] w-3 h-3 bg-indigo-200 rounded-full" />
      
      {/* Top Header Section */}
      <header className="relative z-10 w-full max-w-lg mb-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-white mb-6 overflow-hidden"
        >
          <img 
            src="https://res.cloudinary.com/dbmokwazr/image/upload/nbhqewrgoxwj3thqxxhn" 
            alt="Robot Logo" 
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-black text-[#1E293B] mb-2"
        >
          Bac DZ AI
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-[#64748B] font-bold"
        >
          مرحباً بك مجدداً في منصة Bac DZ AI
        </motion.p>
      </header>

      {/* Main Login Card */}
      <motion.main 
        initial={{ opacity: 0, sclae: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="relative z-10 w-full max-w-[500px] bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white p-8 md:p-12"
      >
        <LoginForm onSuccess={handleLoginSuccess} />
        
        <div className="mt-8">
          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <span className="relative px-4 bg-white text-[11px] font-black text-gray-400 uppercase tracking-widest">أو عبر</span>
          </div>
          
          <OAuthButtons onSuccess={handleLoginSuccess} onError={setError} />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6"
            >
              <ErrorMessage message={error} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>

      {/* Bottom Features Footer */}
      <footer className="relative z-10 w-full max-w-[500px] mt-10">
        <div className="bg-[#F1F5F9]/50 backdrop-blur-sm rounded-[32px] p-6 border border-white flex justify-between items-center text-center">
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 mb-1">
              <GraduationCap size={20} />
            </div>
            <span className="text-[10px] font-black text-[#1E293B]">محتوى ذكي</span>
            <span className="text-[8px] text-[#64748B] font-bold">تعلم بذكاء</span>
          </div>
          
          <div className="w-px h-10 bg-gray-200 mx-2" />
          
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 mb-1">
              <Sparkles size={18} />
            </div>
            <span className="text-[10px] font-black text-[#1E293B]">سريع وسهل</span>
            <span className="text-[8px] text-[#64748B] font-bold">تجربة سلسة</span>
          </div>

          <div className="w-px h-10 bg-gray-200 mx-2" />

          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 mb-1">
              <Target size={18} />
            </div>
            <span className="text-[10px] font-black text-[#1E293B]">آمن وموثوق</span>
            <span className="text-[8px] text-[#64748B] font-bold">حماية بياناتك</span>
          </div>
        </div>
      </footer >
    </div>
  );
}
