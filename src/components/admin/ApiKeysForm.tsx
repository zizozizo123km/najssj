import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { db, doc, getDoc, setDoc } from '../../lib/firebase';

const API_TYPES = [
  { id: 'youtube', name: 'YouTube API', fields: ['api_key', 'channel_id', 'region', 'notes'] },
  { id: 'gemini', name: 'Gemini API', fields: ['api_key', 'model_name', 'region', 'notes'] },
  { id: 'cloudinary', name: 'Cloudinary API', fields: ['cloudinary_url', 'upload_preset', 'cloud_name', 'notes'] },
  { id: 'secondary_db', name: 'قاعدة بيانات إضافية', fields: ['db_host', 'db_user', 'db_password', 'db_name'] }
];

export default function ApiKeysForm() {
  const [keys, setKeys] = useState<any>({
    youtube: Array(1).fill({ api_key: '', channel_id: '', region: '', notes: '' }),
    gemini: Array(1).fill({ api_key: '', model_name: '', region: '', notes: '' }),
    cloudinary: Array(1).fill({ cloudinary_url: '', upload_preset: '', cloud_name: '', notes: '' }),
    secondary_db: Array(1).fill({ db_host: '', db_user: '', db_password: '', db_name: '' })
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
    if (!newKeys[api]) newKeys[api] = Array(1).fill({});
    if (!newKeys[api][index]) newKeys[api][index] = {};
    
    newKeys[api][index] = { ...newKeys[api][index], [field]: value };
    setKeys(newKeys);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'admin_settings', 'api_keys'), { settings: keys });
      alert('تم حفظ الإعدادات بنجاح!');
    } catch (error) {
      console.error('Error saving API keys:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center text-gray-400 py-8">جاري تحميل الإعدادات...</div>;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-white">إدارة الإعدادات و API</h2>
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
            <div className="grid grid-cols-1 gap-4">
              {api.fields.map(field => (
                <div key={field} className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 capitalize">{field.replace('_', ' ')}</label>
                  <input
                    type={field.includes('password') ? 'password' : 'text'}
                    value={keys[api.id]?.[0]?.[field] || ''}
                    onChange={(e) => handleChange(api.id, 0, field, e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
                    dir="ltr"
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
