import { db, doc, getDoc } from './firebase';

export async function getApiKey(service: string, field: string = 'api_key') {
  try {
    const docRef = doc(db, 'admin_settings', 'api_keys');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const settings = docSnap.data().settings;
      if (settings[service] && settings[service][0] && settings[service][0][field]) {
        return settings[service][0][field];
      }
    }
  } catch (error) {
    console.error(`Error fetching API key for ${service}:`, error);
  }
  return null;
}
