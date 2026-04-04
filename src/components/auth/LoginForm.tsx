import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      if (rememberMe) {
        localStorage.setItem('rememberedUser', email);
      } else {
        localStorage.removeItem('rememberedUser');
      }
      
      onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('خطأ في البريد الإلكتروني أو كلمة المرور.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('البريد الإلكتروني مستخدم بالفعل.');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة جداً.');
      } else {
        setError('حدث خطأ ما. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('يرجى إدخال البريد الإلكتروني أولاً.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
    } catch (err: any) {
      setError('فشل إرسال رابط إعادة التعيين.');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-gray-900">
          {isRegistering ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
        </h2>
        <p className="text-sm text-gray-500 font-medium">
          {isRegistering ? 'ابدأ رحلة النجاح معنا اليوم' : 'مرحباً بك مجدداً في منصة Bac DZ AI'}
        </p>
      </div>

      <ErrorMessage message={error} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Mail size={16} className="text-blue-500" /> البريد الإلكتروني
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="w-full p-4 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-right"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Lock size={16} className="text-blue-500" /> كلمة المرور
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-4 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-right"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-5 h-5 border-2 border-gray-200 rounded-md peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all"></div>
              <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 transition-opacity">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">تذكرني</span>
          </label>

          {!isRegistering && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              نسيت كلمة المرور؟
            </button>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? (
            <Loader />
          ) : (
            <>
              {isRegistering ? <UserPlus size={20} /> : <LogIn size={20} />}
              <span>{isRegistering ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</span>
            </>
          )}
        </motion.button>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-500 font-medium">
          {isRegistering ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'}
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="mr-2 text-blue-600 font-black hover:underline"
          >
            {isRegistering ? 'تسجيل الدخول' : 'إنشاء حساب مجاني'}
          </button>
        </p>
      </div>
    </div>
  );
}
