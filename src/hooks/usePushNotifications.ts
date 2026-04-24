import { useState, useEffect } from 'react';
import { messaging, auth, db, doc, updateDoc } from '../lib/firebase';
import { getToken } from 'firebase/messaging';

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestPermission = async () => {
    if (typeof Notification === 'undefined' || !messaging) return;

    try {
      const status = await Notification.requestPermission();
      setPermission(status);
      
      if (status === 'granted') {
        const fcmToken = await getToken(messaging, {
          vapidKey: 'BIsy66Ym_7xZ1O3bK_xS9u3vH9U8pW8nK7z0S4iE-Lp8' // You should replace this with your VAPID key
        });
        
        if (fcmToken) {
          setToken(fcmToken);
          // Save token to user profile
          if (auth.currentUser) {
            await updateDoc(doc(db, 'profiles', auth.currentUser.uid), {
              fcm_token: fcmToken
            });
          }
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  useEffect(() => {
    if (auth.currentUser && permission === 'granted' && !token) {
      requestPermission();
    }
  }, [auth.currentUser]);

  return { token, permission, requestPermission };
}
