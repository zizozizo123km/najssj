import { useState } from 'react';
import { Send, Loader2, BellRing } from 'lucide-react';
import { auth, db, collection, addDoc, serverTimestamp } from '../../lib/firebase';

export default function NotificationForm() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent, isTest: boolean = false) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setLoading(true);
    try {
      if (isTest) {
        // In a real app, this would send only to the admin's device token
        alert(`🔔 إشعار تجريبي:\n\nالعنوان: ${title}\nالرسالة: ${message}`);
      } else {
        const user = auth.currentUser;
        await addDoc(collection(db, 'notifications'), {
          title,
          message,
          sent_by: user?.email || 'Admin',
          created_at: serverTimestamp()
        });
        
        setTitle('');
        setMessage('');
        alert('تم إرسال الإشعار بنجاح للجميع!');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('حدث خطأ أثناء إرسال الإشعار');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
      <h2 className="text-xl font-black text-white mb-6">إرسال إشعار للجميع</h2>
      <form onSubmit={(e) => handleSend(e, false)} className="space-y-4">
        <div>
          <label className="block text-gray-400 text-sm font-bold mb-2">عنوان الإشعار</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            placeholder="مثال: تحديث جديد للتطبيق!"
            required
          />
        </div>
        <div>
          <label className="block text-gray-400 text-sm font-bold mb-2">نص الإشعار</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full h-32 bg-gray-900 border border-gray-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
            placeholder="اكتب رسالتك هنا..."
            required
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={(e) => handleSend(e, true)}
            disabled={loading || !title.trim() || !message.trim()}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>تجربة الإشعار</span>
            <BellRing size={18} />
          </button>
          <button
            type="submit"
            disabled={loading || !title.trim() || !message.trim()}
            className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                <span>إرسال للجميع</span>
                <Send size={18} className="rotate-180" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
