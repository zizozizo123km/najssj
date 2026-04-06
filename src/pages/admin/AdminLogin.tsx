import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, signInWithEmailAndPassword, doc, getDoc, signOut } from '../../lib/firebase';
import { Shield, Lock, Mail, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
        const profile = profileDoc.data();

        if (profile?.role === 'admin' || user.email === "dzs325105@gmail.com") {
          navigate('/admin/dashboard');
        } else {
          setError('ليس لديك صلاحيات المسؤول.');
          await signOut(auth);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 font-sans dir-rtl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-700"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-4">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-black text-white">تسجيل دخول المسؤول</h1>
          <p className="text-gray-400 text-sm mt-2">لوحة تحكم تطبيق البكالوريا</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm font-bold text-center mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">البريد الإلكتروني</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-3 pr-10 pl-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="admin@example.com"
                required
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">كلمة المرور</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-3 pr-10 pl-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="••••••••"
                required
                dir="ltr"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'تسجيل الدخول'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
