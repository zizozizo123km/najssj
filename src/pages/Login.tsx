import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (err: any) {
      setError(isRegistering ? 'فشل إنشاء الحساب.' : 'فشل تسجيل الدخول. يرجى التحقق من البيانات.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">{isRegistering ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</h2>
        {error && <p className="text-red-500 mb-4 text-sm text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700">
            {isRegistering ? 'إنشاء حساب' : 'دخول'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          {isRegistering ? 'لديك حساب بالفعل؟ ' : 'ليس لديك حساب؟ '}
          <button onClick={() => setIsRegistering(!isRegistering)} className="text-blue-600 font-bold">
            {isRegistering ? 'تسجيل الدخول' : 'إنشاء حساب'}
          </button>
        </p>
      </div>
    </div>
  );
}
