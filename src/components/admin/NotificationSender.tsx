import { useState } from 'react';
import { Bell, Send } from 'lucide-react';
import { db, collection, addDoc, serverTimestamp } from '../../lib/firebase';

export default function NotificationSender() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!title || !body) return alert('يرجى ملء العنوان والنص');
    setLoading(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        title,
        body,
        created_at: serverTimestamp(),
      });
      alert('تم إرسال الإشعار بنجاح للطلاب!');
      setTitle('');
      setBody('');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الإرسال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Bell size={20} className="text-blue-500" />
        إرسال إشعار للطلاب
      </h3>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="عنوان الإشعار"
        className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-white"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="نص الإشعار"
        className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-white"
        rows={3}
      />
      <button
        onClick={handleSend}
        disabled={loading}
        className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
      >
        {loading ? 'جاري الإرسال...' : 'إرسال الإشعار'}
      </button>
    </div>
  );
}
