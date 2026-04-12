import { useState } from 'react';
import { Bell, Send } from 'lucide-react';

export default function NotificationSender() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSend = async () => {
    if (!title || !body || !token) {
      setStatus({ type: 'error', message: 'يرجى ملء جميع الحقول' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, token }),
      });
      const data = await response.json();
      if (response.ok) {
        setStatus({ type: 'success', message: 'تم إرسال الإشعار بنجاح!' });
        setTitle('');
        setBody('');
      } else {
        setStatus({ type: 'error', message: data.error || 'فشل إرسال الإشعار' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'حدث خطأ أثناء الاتصال بالخادم' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Bell size={20} className="text-blue-500" />
        إرسال إشعار جديد
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
      <input
        type="text"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="توكن FCM الخاص بالجهاز"
        className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-white"
      />
      <button
        onClick={handleSend}
        disabled={loading}
        className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        {loading ? 'جاري الإرسال...' : <><Send size={18} /> إرسال الإشعار</>}
      </button>
      {status && (
        <div className={`p-3 rounded-xl text-sm font-bold ${status.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}
