import { db, doc, getDoc } from './firebase';

export async function getApiKey(service: string, field: string = 'api_key') {
  try {
    const docRef = doc(db, 'admin_settings', 'api_keys');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const settings = docSnap.data().settings;
      if (settings[service] && Array.isArray(settings[service]) && settings[service].length > 0) {
        // Filter out empty keys
        const validKeys = settings[service].filter((k: any) => k[field] && k[field].trim() !== '');
        if (validKeys.length > 0) {
          // Pick a random key to load balance
          const randomIndex = Math.floor(Math.random() * validKeys.length);
          return validKeys[randomIndex][field];
        }
      }
    }
  } catch (error) {
    console.error(`Error fetching API key for ${service}:`, error);
  }
  return null;
}
