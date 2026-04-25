import { useState } from 'react';
import { Bell, Send, Loader2 } from 'lucide-react';
import { db, collection, addDoc, serverTimestamp, getDocs, query, where } from '../../lib/firebase';

export default function NotificationSender() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [pushType, setPushType] = useState<'all' | 'specific'>('all');

  const handleSend = async () => {
    if (!title || !body) return alert('يرجى ملء العنوان والنص');
    setLoading(true);
    try {
      // 1. Save to Firestore for the "Notifications" page list
      await addDoc(collection(db, 'notifications'), {
        title,
        body,
        created_at: serverTimestamp(),
        type: 'broadcast'
      });

      // 2. Trigger Push Notifications via Server API
      // Fetch all user tokens from profiles
      const profilesSnap = await getDocs(query(collection(db, 'profiles'), where('fcm_token', '!=', null)));
      const tokens = profilesSnap.docs.map(doc => doc.data().fcm_token).filter(t => !!t);

      if (tokens.length > 0) {
        let successCount = 0;
        let failCount = 0;
        // Send to each token
        for (const token of tokens) {
          try {
            const response = await fetch('/api/send-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title, body, token })
            });
            const data = await response.json();
            if (response.ok && data.success) {
              successCount++;
            } else {
              failCount++;
              console.error('Failed to send to token:', token, data);
            }
          } catch (err) {
            failCount++;
            console.error('Network error sending to token:', token, err);
          }
        }
        alert(`تم الإرسال (Firestore + Push)! بنجاح: ${successCount}، فشل: ${failCount}`);
      } else {
        alert('تم الحفظ في Firestore بنجاح، ولكن لم يتم العثور على أجهزة مسجلة (FCM Tokens)');
      }
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
      <div className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="عنوان الإشعار"
          className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="نص الإشعار"
          className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={18} />}
          {loading ? 'جاري الإرسال...' : 'إرسال الإشعار'}
        </button>
      </div>
    </div>
  );
}
