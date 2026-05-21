import React from 'react';
import { motion } from 'motion/react';
import { auth, db, doc, getDoc, setDoc, serverTimestamp, googleProvider, signInWithPopup } from '../../lib/firebase';

interface OAuthButtonsProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function OAuthButtons({ onSuccess, onError }: OAuthButtonsProps) {
  const handleGoogleLogin = async () => {
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
      console.error(error);
      onError('فشل تسجيل الدخول عبر Google.');
    }
  };

  return (
    <div className="flex justify-center flex-col items-center gap-4">
      <motion.button
        whileHover={{ scale: 1.01, backgroundColor: '#fcfcfc' }}
        whileTap={{ scale: 0.99 }}
        onClick={handleGoogleLogin}
        className="flex items-center justify-center gap-4 p-5 border border-gray-100 rounded-[24px] hover:bg-gray-50 transition-all w-full shadow-sm bg-white group"
      >
        <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-50">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
        </div>
        <span className="text-sm font-black text-[#1E293B]">تسجيل الدخول عبر Google</span>
      </motion.button>
      
      <p className="text-[10px] text-gray-400 font-bold max-w-[200px] leading-relaxed">
        بالتسجيل، أنت توافق على شروط الخدمة وسياسة الخصوصية
      </p>
    </div>
  );
}
