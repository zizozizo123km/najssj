import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, BookOpen } from 'lucide-react';
import { auth, db, doc, setDoc, serverTimestamp } from '../../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { BAC_BRANCHES } from '../../data/baccalaureate';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState(BAC_BRANCHES[0].id);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create profile in Firestore
        await setDoc(doc(db, 'profiles', user.uid), {
          full_name: fullName,
          branch: branch,
          role: 'student',
          points: 0,
          created_at: serverTimestamp()
        });
        
        onSuccess();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onSuccess();
      }
      
      if (rememberMe) {
        localStorage.setItem('rememberedUser', email);
      } else {
        localStorage.removeItem('rememberedUser');
      }
    } catch (err: any) {
      console.error(err);
      let message = 'حدث خطأ ما. يرجى المحاولة مرة أخرى.';
      if (err.code === 'auth/email-already-in-use') message = 'البريد الإلكتروني مستخدم بالفعل.';
      if (err.code === 'auth/weak-password') message = 'كلمة المرور ضعيفة جداً.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      }
      setError(message);
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
    <div className="space-y-8" dir="rtl">
      {/* Header section with sparkles and underline */}
      <div className="relative flex flex-col items-center">
        <div className="flex items-center gap-3">
          <span className="text-[#3B82F6] opacity-30 select-none">✦</span>
          <h2 className="text-3xl font-black text-[#1E293B]">
            {isRegistering ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </h2>
          <span className="text-[#3B82F6] opacity-30 select-none">✦</span>
        </div>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: 60 }}
          className="h-1 bg-blue-600 rounded-full mt-3"
        />
      </div>

      <ErrorMessage message={error} />
      
      {successMessage && (
        <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-xs font-bold text-center">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-[#1E293B]">
               البريد الإلكتروني
            </div>
            <Mail size={16} className="text-[#3B82F6] opacity-40" />
          </div>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full bg-[#F8FAFC] p-4 pr-12 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-right text-sm placeholder:text-gray-400 font-medium"
              required
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-xl shadow-sm">
              <Mail size={16} className="text-blue-600" />
            </div>
          </div>
        </div>

        {isRegistering && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#1E293B]">
                 الاسم الكامل
              </div>
              <UserPlus size={16} className="text-[#3B82F6] opacity-40" />
            </div>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أدخل اسمك الكامل"
                className="w-full bg-[#F8FAFC] p-4 pr-12 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-right text-sm placeholder:text-gray-400 font-medium"
                required
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-xl shadow-sm">
                <UserPlus size={16} className="text-blue-600" />
              </div>
            </div>
          </div>
        )}

        {isRegistering && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#1E293B]">
                 الشعبة
              </div>
              <BookOpen size={16} className="text-[#3B82F6] opacity-40" />
            </div>
            <div className="relative">
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full bg-[#F8FAFC] p-4 pr-12 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-right text-sm font-medium bg-white appearance-none"
                required
              >
                {BAC_BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-xl shadow-sm">
                <BookOpen size={16} className="text-blue-600" />
              </div>
            </div>
          </div>
        )}

        {/* Password Field */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-[#1E293B]">
               كلمة المرور
            </div>
            <Lock size={16} className="text-[#3B82F6] opacity-40" />
          </div>
          <div className="relative group">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#F8FAFC] p-4 pr-12 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-right text-sm placeholder:text-gray-400 font-medium"
              required
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-xl shadow-sm z-10">
              <Lock size={16} className="text-blue-600" />
            </div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-xl shadow-sm text-blue-600 hover:bg-blue-50 transition-all border border-blue-100"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
              <div className="w-6 h-6 bg-[#F1F5F9] border-2 border-transparent rounded-lg peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all shadow-sm"></div>
              <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 transition-opacity">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <span className="text-xs font-black text-[#64748B] group-hover:text-[#1E293B] transition-colors">تذكرني</span>
          </label>

          {!isRegistering && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs font-black text-blue-600 hover:text-blue-700 transition-colors"
            >
              نسيت كلمة المرور؟
            </button>
          )}
        </div>

        {/* Submit Button with Gradient */}
        <motion.button
          whileHover={{ scale: 1.01, boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)' }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white p-5 rounded-[24px] font-black shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 disabled:opacity-70 group"
        >
          {loading ? (
            <Loader />
          ) : (
            <>
              <span className="text-sm">
                {isRegistering ? 'إنشاء حساب مجاني' : 'تسجيل الدخول'}
              </span>
              <LogIn size={18} className="transform group-hover:translate-x-[-4px] transition-transform" />
            </>
          )}
        </motion.button>
      </form>

      <div className="text-center">
        <p className="text-sm text-[#64748B] font-bold">
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
