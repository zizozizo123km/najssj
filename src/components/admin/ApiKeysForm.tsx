import { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { db, doc, getDoc, setDoc } from '../../lib/firebase';
import { Plus, Trash2 } from 'lucide-react';

const API_TYPES = [
  { id: 'youtube', name: 'YouTube API', fields: ['api_key', 'channel_id', 'region', 'notes'] },
  { id: 'gemini', name: 'Gemini API', fields: ['api_key', 'model_name', 'region', 'notes'] },
  { id: 'cloudinary', name: 'Cloudinary API', fields: ['cloudinary_url', 'upload_preset', 'cloud_name', 'notes'] },
  { id: 'secondary_db', name: 'قاعدة بيانات إضافية', fields: ['db_host', 'db_user', 'db_password', 'db_name'] }
];

export default function ApiKeysForm() {
  const [keys, setKeys] = useState<any>({
    youtube: [{ api_key: '', channel_id: '', region: '', notes: '' }],
    gemini: [{ api_key: '', model_name: '', region: '', notes: '' }],
    cloudinary: [{ 
      cloudinary_url: 'cloudinary://946433472178741:uWZ5l-dv0mTBIwr0AO6C9Q26xMY@dbmokwazr', 
      upload_preset: 'prest', 
      cloud_name: 'dbmokwazr', 
      notes: '' 
    }],
    secondary_db: [{ db_host: '', db_user: '', db_password: '', db_name: '' }]
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const docRef = doc(db, 'admin_settings', 'api_keys');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data().settings;
          // Ensure arrays exist for each type
          const mergedKeys = { ...keys };
          Object.keys(data).forEach(key => {
            if (Array.isArray(data[key]) && data[key].length > 0) {
              mergedKeys[key] = data[key];
            }
          });
          setKeys(mergedKeys);
        }
      } catch (error) {
        console.error('Error fetching API keys:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchKeys();
  }, []);

  const saveKeys = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'admin_settings', 'api_keys'), { settings: keys });
      alert('تم حفظ الإعدادات بنجاح!');
    } catch (error) {
      console.error('Error saving API keys:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات.');
    } finally {
      setSaving(false);
    }
  };

  const [testStatus, setTestStatus] = useState<{ loading: boolean; message: string; success: boolean | null }>({
    loading: false,
    message: '',
    success: null
  });

  const testGemini = async (index: number) => {
    setTestStatus({ loading: true, message: 'جاري التجربة...', success: null });
    try {
      const geminiSettings = keys.gemini?.[index];
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
    if (!newKeys[api]) newKeys[api] = [{}];
    if (!newKeys[api][index]) newKeys[api][index] = {};
    
    newKeys[api][index] = { ...newKeys[api][index], [field]: value };
    setKeys(newKeys);
  };

  const addKey = (api: string) => {
    const newKeys = { ...keys };
    if (!newKeys[api]) newKeys[api] = [];
    
    const emptyKey: any = {};
    const apiDef = API_TYPES.find(a => a.id === api);
    if (apiDef) {
      apiDef.fields.forEach(f => emptyKey[f] = '');
    }
    
    newKeys[api].push(emptyKey);
    setKeys(newKeys);
  };

  const removeKey = (api: string, index: number) => {
    const newKeys = { ...keys };
    if (newKeys[api] && newKeys[api].length > 1) {
      newKeys[api].splice(index, 1);
      setKeys(newKeys);
    }
  };

  const GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite-preview',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];

  if (loading) return <div className="text-center text-gray-400 py-8">جاري تحميل الإعدادات...</div>;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-white">إدارة الإعدادات و API</h2>
        <button 
          onClick={saveKeys}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>

      <div className="space-y-8">
        {API_TYPES.map(api => (
          <div key={api.id} className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{api.name}</h3>
              <button 
                onClick={() => addKey(api.id)}
                className="flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 text-blue-400 px-3 py-1.5 rounded-lg border border-gray-600 transition-colors"
              >
                <Plus size={16} />
                <span>إضافة حقل جديد</span>
              </button>
            </div>
            
            <div className="space-y-6">
              {(keys[api.id] || [{}]).map((keyItem: any, index: number) => (
                <div key={index} className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 relative">
                  {keys[api.id].length > 1 && (
                    <button 
                      onClick={() => removeKey(api.id, index)}
                      className="absolute top-4 left-4 text-red-400 hover:text-red-300 bg-red-400/10 p-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  
                  <div className="mb-4 text-sm font-bold text-gray-400">
                    المفتاح #{index + 1}
                  </div>

                  {api.id === 'gemini' && (
                    <div className="mb-4 p-4 bg-gray-800 rounded-xl space-y-3 border border-gray-600">
                      <label className="text-xs font-bold text-gray-400">اختر النموذج</label>
                      <select
                        value={keyItem.model_name || 'gemini-1.5-flash'}
                        onChange={(e) => handleChange('gemini', index, 'model_name', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
                      >
                        {GEMINI_MODELS.map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => testGemini(index)}
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
                          value={keyItem[field] || ''}
                          onChange={(e) => handleChange(api.id, index, field, e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
                          dir="ltr"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
