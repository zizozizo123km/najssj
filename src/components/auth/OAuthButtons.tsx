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
    <div className="space-y-3">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <span className="relative px-4 text-xs text-gray-500 bg-white uppercase">أو عبر</span>
      </div>

      <div className="flex justify-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all w-full max-w-xs"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          <span className="text-sm font-bold text-gray-700">تسجيل الدخول عبر Google</span>
        </motion.button>
      </div>
    </div>
  );
}
