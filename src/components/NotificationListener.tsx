import { useEffect } from 'react';
import { db, collection, query, orderBy, limit, onSnapshot } from '../lib/firebase';

export default function NotificationListener() {
  useEffect(() => {
    // مراقبة آخر إشعار فقط
    const q = query(collection(db, 'notifications'), orderBy('created_at', 'desc'), limit(1));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          // إظهار تنبيه بسيط (يمكنك استبداله بمكتبة toast إذا أردت)
          alert(`${data.title}\n\n${data.body}`);
        }
      });
    });

    return () => unsubscribe();
  }, []);

  return null; // هذا المكون لا يعرض واجهة، فقط يعمل في الخلفية
}
