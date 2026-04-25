import { useState, useEffect } from 'react';
import { messaging, auth, db, doc, updateDoc } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getToken, onMessage } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

const ALGERIAN_REMINDERS = [
  {
    title: 'يا خو تقرا ولا والو؟',
    body: 'الباك راه قريب ونت مازال ما مدرت والو! نوض اضرب طلة على الدروس.'
  },
  {
    title: 'حان وقت المراجعة!',
    body: 'حاب تنجح ولا نسيت؟ الباك ما يستنى حتى واحد، ابدا تراجع دروك.'
  },
  {
    title: 'الباك راه يجري!',
    body: 'الوقت راه يطير يا بطل. ابدا اليوم خير من غدوة، النجاح يستنى فيك.'
  },
  {
    title: 'وين راك واصل؟',
    body: 'الباك راهو قريب، ما تخليش الدروس تتراكم عليك. نوض تقرا شوية.'
  }
];

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const isNative = Capacitor.isNativePlatform();

  const scheduleLocalReminder = async () => {
    if (!isNative) return;

    try {
      // Clear existing notifications first to avoid spam
      await LocalNotifications.cancel({ notifications: [{ id: 100 }] });

      const randomMsg = ALGERIAN_REMINDERS[Math.floor(Math.random() * ALGERIAN_REMINDERS.length)];

      // Schedule a notification for 4 hours from now as a reminder
      await LocalNotifications.schedule({
        notifications: [
          {
            title: randomMsg.title,
            body: randomMsg.body,
            id: 100,
            schedule: { at: new Date(Date.now() + 1000 * 60 * 60 * 4) }, // 4 hours
            sound: 'default',
            actionTypeId: '',
            extra: null
          }
        ]
      });
      console.info('Local reminder scheduled');
    } catch (e) {
      console.error('Error scheduling local notification', e);
    }
  };

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
        
        // Also request local notification permissions
        await LocalNotifications.requestPermissions();
        // Schedule first reminder
        scheduleLocalReminder();
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
          vapidKey: 'BGRimIsnG5iBOPXKxlxgYtpZaamMUDG9f_fuD_cQNRWykPHP8gMQV6b22ryVkPXqRoN_83IgtcCAafny_rX86Wo'
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
          fcm_token: fcmToken,
          last_token_update: new Date().toISOString()
        });
        console.info('FCM Token saved to Firestore');
      } catch (error) {
        console.error('Error saving fcm token:', error);
      }
    }
  };

  useEffect(() => {
    if ('serviceWorker' in navigator && !isNative) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Registration successful, scope is:', registration.scope);
        })
        .catch((err) => {
          console.log('Service worker registration failed, error:', err);
        });
    }

    if (!isNative && messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        if (payload.notification) {
          new Notification(payload.notification.title || 'تنبیه', {
            body: payload.notification.body || '',
            icon: '/icon-192.png'
          });
        }
      });
      return () => unsubscribe();
    }

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
          if (notification.title || notification.body) {
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (token) {
          saveToken(token);
        }
        scheduleLocalReminder();
      }
    });
    return () => unsubscribe();
  }, [token]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && isNative) {
        requestPermission();
      }
    });
    return () => unsubscribe();
  }, [isNative]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && permission === 'granted' && !token) {
        requestPermission();
      }
    });
    return () => unsubscribe();
  }, [permission, token]);

  return { token, permission, requestPermission };
}
