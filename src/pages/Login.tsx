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
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-white overflow-hidden font-sans" dir="rtl">
      {/* Left Side: Branding & Motivation (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center p-12 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700" />
        
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        
        <div className="relative z-10 max-w-lg space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: [-1, 1, -1, 1, 0],
              rotate: [-0.5, 0.5, -0.5, 0.5, 0]
            }}
            transition={{ 
              opacity: { duration: 0.5 },
              scale: { duration: 0.5 },
              x: { repeat: Infinity, duration: 0.5, repeatDelay: 2 },
              rotate: { repeat: Infinity, duration: 0.5, repeatDelay: 2 }
            }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-blue-100 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=300&q=80" 
                alt="Welcome Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-4xl font-black tracking-tight">Bac DZ AI</h1>
          </motion.div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold leading-tight">شريكك الذكي للنجاح في شهادة البكالوريا</h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              انضم إلى آلاف الطلبة المتفوقين واستفد من أدوات الذكاء الاصطناعي، الملخصات الشاملة، والاختبارات التفاعلية.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-8">
            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
              <Brain className="text-blue-200" />
              <span className="font-bold">أستاذ افتراضي</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
              <BookOpen className="text-blue-200" />
              <span className="font-bold">مكتبة شاملة</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
              <Target className="text-blue-200" />
              <span className="font-bold">اختبارات ذكية</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
              <Sparkles className="text-blue-200" />
              <span className="font-bold">تحليل يوتيوب</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center gap-4 mb-8">
            <motion.div 
              animate={{ 
                x: [-1, 1, -1, 1, 0],
                rotate: [-0.5, 0.5, -0.5, 0.5, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 0.5, 
                repeatDelay: 2 
              }}
              className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-600/20 overflow-hidden border-4 border-white"
            >
              <img 
                src="https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=300&q=80" 
                alt="Welcome Logo" 
                className="w-full h-full object-cover"
              />
            </motion.div>
            <h1 className="text-2xl font-black text-gray-900">Bac DZ AI</h1>
          </div>

          <LoginForm onSuccess={handleLoginSuccess} />
          
          <OAuthButtons onSuccess={handleLoginSuccess} onError={setError} />

          <AnimatePresence>
            {error && (
              <div className="mt-4">
                <ErrorMessage message={error} />
              </div>
            )}
          </AnimatePresence>

          <footer className="pt-8 text-center">
            <p className="text-xs text-gray-400 font-medium">
              بالتسجيل في المنصة، أنت توافق على <button className="underline hover:text-gray-600">شروط الخدمة</button> و <button className="underline hover:text-gray-600">سياسة الخصوصية</button>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
