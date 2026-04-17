import { useEffect } from 'react';
import { db, collection, query, orderBy, limit, onSnapshot } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/utils';

export default function NotificationListener({ onNotification }: { onNotification: (notification: any) => void }) {
  useEffect(() => {
    // مراقبة آخر إشعار فقط
    const q = query(collection(db, 'notifications'), orderBy('created_at', 'desc'), limit(1));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          onNotification({ title: data.title, body: data.body });
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => unsubscribe();
  }, [onNotification]);

  return null; // هذا المكون لا يعرض واجهة، فقط يعمل في الخلفية
}
