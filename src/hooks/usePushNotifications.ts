import { useState, useEffect } from 'react';
import { messaging, auth, db, doc, updateDoc } from '../lib/firebase';
import { getToken } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const isNative = Capacitor.isNativePlatform();

  const requestPermission = async () => {
    if (isNative) {
      try {
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === 'granted') {
          setPermission('granted');
          await PushNotifications.register();
        } else {
          setPermission('denied');
        }
      } catch (error) {
        console.error('Error requesting native push permission:', error);
      }
      return;
    }

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
          saveToken(fcmToken);
        }
      }
    } catch (error) {
      console.error('Error requesting web notification permission:', error);
    }
  };

  const saveToken = async (fcmToken: string) => {
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'profiles', auth.currentUser.uid), {
          fcm_token: fcmToken
        });
      } catch (error) {
        console.error('Error saving fcm token:', error);
      }
    }
  };

  useEffect(() => {
    if (isNative) {
      const addListeners = async () => {
        await PushNotifications.addListener('registration', token => {
          console.info('Registration token: ', token.value);
          setToken(token.value);
          saveToken(token.value);
        });

        await PushNotifications.addListener('registrationError', err => {
          console.error('Registration error: ', err.error);
        });

        await PushNotifications.addListener('pushNotificationReceived', notification => {
          console.log('Push notification received: ', notification);
          // For foreground notifications, we might want to manually show a toast or notification
          if (notification.title || notification.body) {
            // We could use an event emitter or a state update here
            // For now, let's just log it. The UI should ideally have a way to show persistent alerts.
            new Notification(notification.title || 'تنبیه', {
              body: notification.body || '',
            });
          }
        });

        await PushNotifications.addListener('pushNotificationActionPerformed', notification => {
          console.log('Push notification action performed', notification.actionId, notification.inputValue);
        });
      };

      addListeners();
    }
  }, []);

  useEffect(() => {
    if (auth.currentUser && permission === 'granted' && !token) {
      requestPermission();
    }
  }, [auth.currentUser]);

  return { token, permission, requestPermission };
}
