import { useState, useEffect } from 'react';
import { db, collection, query, onSnapshot } from '../../lib/firebase';
import { Smartphone, User, Copy, Check } from 'lucide-react';

export default function DeviceTokenList() {
  const [devices, setDevices] = useState<any[]>([]);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  useEffect(() => {
    const q = collection(db, 'profiles');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const devicesData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as any))
        .filter(profile => !!profile.fcm_token); // Only show profiles with tokens
      
      setDevices(devicesData);
    });

    return () => unsubscribe();
  }, []);

  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopyStatus(token);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-black text-white flex items-center gap-3">
          <Smartphone className="text-blue-500" />
          الأجهزة المسجلة (FCM Tokens)
        </h2>
        <p className="text-gray-400 text-sm mt-1">هؤلاء هم الطلاب الذين يمكنهم تلقي إشعارات الدفع حالياً</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-4">
          {devices.map((device) => (
            <div key={device.id} className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white">{device.full_name || 'طالب مجهول'}</h3>
                  <p className="text-gray-500 text-sm">{device.email}</p>
                </div>
              </div>

              <div className="flex-1 max-w-md">
                <div className="bg-gray-800 p-2 rounded-lg border border-gray-700 flex items-center justify-between gap-3">
                  <div className="truncate text-xs font-mono text-gray-400 select-all">
                    {device.fcm_token}
                  </div>
                  <button 
                    onClick={() => copyToClipboard(device.fcm_token)}
                    className="p-2 hover:bg-gray-700 rounded-md transition-colors text-gray-400 hover:text-white"
                    title="نسخ التوكن"
                  >
                    {copyStatus === device.fcm_token ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {devices.length === 0 && (
            <div className="text-center py-12">
              <Smartphone size={48} className="mx-auto text-gray-700 mb-4 opacity-20" />
              <p className="text-gray-500 font-bold">لا توجد أجهزة مسجلة حالياً</p>
              <p className="text-gray-400 text-sm mt-1">يجب على الطلاب قبول إذن الإشعارات لتظهر أجهزتهم هنا</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
