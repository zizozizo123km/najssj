import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { db, doc, getDoc, setDoc } from '../../lib/firebase';

const API_TYPES = [
  { id: 'youtube', name: 'YouTube API' },
  { id: 'gemini', name: 'Gemini API' },
  { id: 'cloudinary', name: 'Cloudinary API' }
];

export default function ApiKeysForm() {
  const [keys, setKeys] = useState<any>({
    youtube: Array(4).fill({ key: '', secret: '', endpoint: '', notes: '' }),
    gemini: Array(4).fill({ key: '', secret: '', endpoint: '', notes: '' }),
    cloudinary: Array(4).fill({ key: '', secret: '', endpoint: '', notes: '' })
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const docRef = doc(db, 'admin_settings', 'api_keys');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setKeys(docSnap.data().settings);
        }
      } catch (error) {
        console.error('Error fetching API keys:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchKeys();
  }, []);

  const handleChange = (api: string, index: number, field: string, value: string) => {
    const newKeys = { ...keys };
    if (!newKeys[api]) newKeys[api] = Array(4).fill({ key: '', secret: '', endpoint: '', notes: '' });
    if (!newKeys[api][index]) newKeys[api][index] = { key: '', secret: '', endpoint: '', notes: '' };
    
    newKeys[api][index] = { ...newKeys[api][index], [field]: value };
    setKeys(newKeys);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'admin_settings', 'api_keys'), { settings: keys });
      alert('تم حفظ مفاتيح API بنجاح!');
    } catch (error) {
      console.error('Error saving API keys:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center text-gray-400 py-8">جاري تحميل المفاتيح...</div>;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-white">إدارة مفاتيح API</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          حفظ التغييرات
        </button>
      </div>

      <div className="space-y-8">
        {API_TYPES.map(api => (
          <div key={api.id} className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">{api.name}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[0, 1, 2, 3].map(index => (
                <div key={index} className="bg-gray-800 p-4 rounded-xl border border-gray-700 space-y-3">
                  <h4 className="text-sm font-bold text-gray-400">الحساب {index + 1}</h4>
                  <input
                    type="text"
                    value={keys[api.id]?.[index]?.key || ''}
                    onChange={(e) => handleChange(api.id, index, 'key', e.target.value)}
                    placeholder="API Key"
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
                    dir="ltr"
                  />
                  <input
                    type="text"
                    value={keys[api.id]?.[index]?.secret || ''}
                    onChange={(e) => handleChange(api.id, index, 'secret', e.target.value)}
                    placeholder="API Secret (إن وجد)"
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
                    dir="ltr"
                  />
                  <input
                    type="text"
                    value={keys[api.id]?.[index]?.endpoint || ''}
                    onChange={(e) => handleChange(api.id, index, 'endpoint', e.target.value)}
                    placeholder="Endpoint URL (إن وجد)"
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
                    dir="ltr"
                  />
                  <input
                    type="text"
                    value={keys[api.id]?.[index]?.notes || ''}
                    onChange={(e) => handleChange(api.id, index, 'notes', e.target.value)}
                    placeholder="ملاحظات (مثال: حساب احتياطي)"
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
