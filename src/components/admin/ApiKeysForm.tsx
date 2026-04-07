import { useState, useEffect } from 'react';
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
    cloudinary: Array(1).fill({ 
      cloudinary_url: 'cloudinary://946433472178741:uWZ5l-dv0mTBIwr0AO6C9Q26xMY@dbmokwazr', 
      upload_preset: 'prest', 
      cloud_name: 'dbmokwazr', 
      notes: '' 
    }),
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

  // Auto-save effect
  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        await setDoc(doc(db, 'admin_settings', 'api_keys'), { settings: keys });
      } catch (error) {
        console.error('Error auto-saving API keys:', error);
      } finally {
        setSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [keys, loading]);

  const [testStatus, setTestStatus] = useState<{ loading: boolean; message: string; success: boolean | null }>({
    loading: false,
    message: '',
    success: null
  });

  const testGemini = async () => {
    setTestStatus({ loading: true, message: 'جاري التجربة...', success: null });
    try {
      const geminiSettings = keys.gemini?.[0];
      if (!geminiSettings?.api_key) {
        throw new Error('يرجى إدخال مفتاح API أولاً');
      }
      
      const ai = new GoogleGenAI({ apiKey: geminiSettings.api_key });
      const model = geminiSettings.model_name || 'gemini-3.1-flash-lite-preview';
      
      await ai.models.generateContent({
        model,
        contents: 'Hello, are you working?',
      });
      
      setTestStatus({ loading: false, message: 'تم الاتصال بنجاح! ✅', success: true });
    } catch (error: any) {
      setTestStatus({ loading: false, message: `فشل الاتصال: ${error.message}`, success: false });
    }
  };


  const handleChange = (api: string, index: number, field: string, value: string) => {
    const newKeys = { ...keys };
    if (!newKeys[api]) newKeys[api] = Array(1).fill({});
    if (!newKeys[api][index]) newKeys[api][index] = {};
    
    newKeys[api][index] = { ...newKeys[api][index], [field]: value };
    setKeys(newKeys);
  };

  const GEMINI_MODELS = [
    'gemini-3.1-flash-lite-preview',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];

  if (loading) return <div className="text-center text-gray-400 py-8">جاري تحميل الإعدادات...</div>;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-white">إدارة الإعدادات و API</h2>
        {saving && <div className="text-xs text-green-400 font-bold animate-pulse">جاري الحفظ...</div>}
      </div>

      <div className="space-y-8">
        {API_TYPES.map(api => (
          <div key={api.id} className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">{api.name}</h3>
            
            {api.id === 'gemini' && (
              <div className="mb-4 p-4 bg-gray-800 rounded-xl space-y-3">
                <label className="text-xs font-bold text-gray-400">اختر النموذج</label>
                <select
                  value={keys.gemini?.[0]?.model_name || 'gemini-3.1-flash-lite-preview'}
                  onChange={(e) => handleChange('gemini', 0, 'model_name', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
                >
                  {GEMINI_MODELS.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
                <button
                  onClick={testGemini}
                  disabled={testStatus.loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {testStatus.loading ? 'جاري التجربة...' : 'تجربة الاتصال'}
                </button>
                {testStatus.message && (
                  <p className={`text-xs font-bold text-center ${testStatus.success ? 'text-green-400' : 'text-red-400'}`}>
                    {testStatus.message}
                  </p>
                )}
              </div>
            )}

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
