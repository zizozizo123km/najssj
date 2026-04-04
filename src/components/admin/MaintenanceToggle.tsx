import { useState, useEffect } from 'react';
import { Power, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function MaintenanceToggle() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const docRef = doc(db, 'admin_settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setIsMaintenance(docSnap.data().maintenanceMode || false);
        }
      } catch (error) {
        console.error('Error fetching maintenance status:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleToggle = async () => {
    setToggling(true);
    const newStatus = !isMaintenance;
    try {
      await setDoc(doc(db, 'admin_settings', 'general'), { maintenanceMode: newStatus }, { merge: true });
      setIsMaintenance(newStatus);
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      alert('حدث خطأ أثناء تغيير حالة التطبيق');
    } finally {
      setToggling(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-black text-white mb-1">وضع الصيانة</h2>
        <p className="text-sm text-gray-400">
          {isMaintenance 
            ? 'التطبيق حالياً في وضع الصيانة. لا يمكن للمستخدمين الدخول.' 
            : 'التطبيق يعمل بشكل طبيعي ومتاح لجميع المستخدمين.'}
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={toggling}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${
          isMaintenance ? 'bg-red-500' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
            isMaintenance ? '-translate-x-7' : '-translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
