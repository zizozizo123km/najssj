import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

async function getYouTubeApiKey(): Promise<string | null> {
  const hardcodedKey = "AIzaSyBny9zdLW46V-F_rLQEXtmmmYS1XZLypvc";
  try {
    const db = admin.firestore();
    const doc = await db.collection("admin_settings").doc("api_keys").get();
    if (doc.exists) {
      const settings = doc.data()?.settings;
      const key = settings?.youtube?.[0]?.api_key || null;
      return key || hardcodedKey;
    }
  } catch (error) {
    // Silent failure
  }
  return hardcodedKey;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const query = req.query.q as string;
  const apiKey = await getYouTubeApiKey();
  
  if (!apiKey) {
    return res.status(500).json({ error: "YOUTUBE_API_KEY is not set" });
  }
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${apiKey}&type=video&maxResults=5`
    );
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ error: "YouTube API Error", details: data });
    }
    
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch from YouTube" });
  }
}
