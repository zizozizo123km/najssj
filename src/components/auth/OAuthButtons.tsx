import React from 'react';
import { motion } from 'motion/react';
import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase';

interface OAuthButtonsProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function OAuthButtons({ onSuccess, onError }: OAuthButtonsProps) {
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onSuccess();
    } catch (error: any) {
      onError('فشل تسجيل الدخول باستخدام جوجل.');
    }
  };

  const handleFacebookLogin = async () => {
    const provider = new FacebookAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onSuccess();
    } catch (error: any) {
      onError('فشل تسجيل الدخول باستخدام فيسبوك.');
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

      <div className="grid grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          <span className="text-sm font-bold text-gray-700">Google</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleFacebookLogin}
          className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/facebook.svg" alt="Facebook" className="w-5 h-5" />
          <span className="text-sm font-bold text-gray-700">Facebook</span>
        </motion.button>
      </div>
    </div>
  );
}
