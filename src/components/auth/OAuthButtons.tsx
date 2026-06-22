import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, doc, getDoc, setDoc, serverTimestamp, googleProvider, signInWithPopup } from '../../lib/firebase';
import { AlertCircle, ExternalLink, HelpCircle } from 'lucide-react';

interface OAuthButtonsProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function OAuthButtons({ onSuccess, onError }: OAuthButtonsProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isIframe, setIsIframe] = useState(false);
  const [showIframeNotice, setShowIframeNotice] = useState(false);

  useEffect(() => {
    // Detect if running inside iframe sandbox
    try {
      setIsIframe(window.self !== window.top);
    } catch (e) {
      setIsIframe(true);
    }
  }, []);

  const handleGoogleLogin = async () => {
    if (isSigningIn) return;
    
    setIsSigningIn(true);
    // Suppress previous error when initiating new login
    onError('');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if profile exists, if not create it
      const profileRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (!profileSnap.exists()) {
        await setDoc(profileRef, {
          full_name: user.displayName || user.email?.split('@')[0] || 'مستخدم جديد',
          branch: 'علوم تجريبية', // Default branch
          role: 'student',
          points: 0,
          avatar_url: user.photoURL,
          created_at: serverTimestamp()
        });
      }
      
      onSuccess();
    } catch (error: any) {
      console.error('Core Google Auth Error:', error);
      
      const errorCode = error?.code;
      const errorMessage = error?.message || '';

      if (errorCode === 'auth/popup-blocked' || errorMessage.includes('popup-blocked')) {
        onError(
          'تم حظر النافذة المنبثقة من قِبل المتصفح. لتسجيل الدخول بحساب Google، الرجاء السماح بالمنبثقات لهذا الموقع أو فتح التطبيق في علامة تبويب كاملة (اضغط على أيقونة "فتح في نافذة جديدة" بأعلى يمين المنصة)، أو استخدم تسجيل برقم الهاتف/البريد السريع بكلمة مرور!'
        );
        setShowIframeNotice(true);
      } else if (errorCode === 'auth/cancelled-popup-request' || errorMessage.includes('cancelled-popup-request')) {
        onError(
          'تم إلغاء عملية تسجيل الدخول أو إغلاق نافذة Google المنبثقة قبل اكتمالها.'
        );
      } else if (errorMessage.includes('Pending promise was never set') || errorMessage.includes('INTERNAL ASSERTION FAILED')) {
        onError(
          'حدث تعارض في المتصفح بسبب إلغاء الاتصال السابق. يرجى تحديث الصفحة (Refresh) لتحديث الاتصال، ثم تسجيل الدخول أو استخدام كلمة المرور مباشرة.'
        );
      } else {
        onError(`فشل تسجيل الدخول عبر Google: ${error?.message || 'يرجى المحاولة مجدداً.'}`);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="flex justify-center flex-col items-center gap-4 w-full">
      {/* If running inside iframe, show a polite informative badge */}
      {isIframe && (
        <div className="w-full bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 text-right flex items-start gap-2.5 shadow-sm">
          <HelpCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="text-[11px] font-black text-blue-800 leading-tight">تنبيه لزوار المعاينة المباشرة:</h4>
            <p className="text-[10px] text-blue-650 font-bold leading-relaxed">
              خدمة تسجيل Google تتطلب فتح تطبيق في علامة تبويب مستقلة كاملة لتخطي قيود الإطارات (iframes). ننصحك باستخدام التسجيل الفوري برمز الدخول (رقم الهاتف/البريد وكلمة المرور) فهو يعمل 100٪ مباشرة من داخل هذه المعاينة!
            </p>
          </div>
        </div>
      )}

      <motion.button
        whileHover={!isSigningIn ? { scale: 1.01, backgroundColor: '#fcfcfc' } : {}}
        whileTap={!isSigningIn ? { scale: 0.99 } : {}}
        onClick={handleGoogleLogin}
        disabled={isSigningIn}
        className={`flex items-center justify-center gap-4 p-5 border border-gray-100 rounded-[24px] hover:bg-gray-50 transition-all w-full shadow-sm bg-white group select-none ${
          isSigningIn ? 'opacity-70 cursor-not-allowed bg-gray-50' : 'cursor-pointer'
        }`}
      >
        <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-50 flex-shrink-0">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
        </div>
        <span className="text-sm font-black text-[#1E293B]">
          {isSigningIn ? 'برجاء الانتظار...' : 'تسجيل الدخول عبر Google'}
        </span>
      </motion.button>

      <AnimatePresence>
        {showIframeNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full bg-amber-50 rounded-2xl p-4 border border-amber-200 text-amber-850 text-xs font-bold text-right flex flex-col gap-2 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-655" />
              <span className="font-black text-amber-900">كيف تحل هذه المشكلة؟</span>
            </div>
            <p className="leading-relaxed leading-medium text-[11px] text-amber-800">
              لتسجيل الدخول بـ Google دون عوائق، اضغط على زر <strong>"فتح في متصفح خارجي / نافذة جديدة" <ExternalLink size={11} className="inline" /></strong> المتاح بأعلى يمين نافذة المعاينة في برنامج AI Studio لتفتح التطبيق في صفحة مستقلة كاملة. أو تفضل بإنشاء حساب فوري مجاني بالهاتف أو البريد هنا.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <p className="text-[10px] text-gray-400 font-bold max-w-[200px] leading-relaxed text-center">
        بالتسجيل، أنت توافق على شروط الخدمة وسياسة الخصوصية
      </p>
    </div>
  );
}
