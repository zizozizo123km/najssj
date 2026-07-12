import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleGenAI } from "@google/genai";
// @ts-ignore
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: firebaseConfig.projectId
  });
}
const db = getFirestore(undefined, firebaseConfig.firestoreDatabaseId);

async function getYouTubeApiKey(): Promise<string | null> {
  const hardcodedKey = "AIzaSyBny9zdLW46V-F_rLQEXtmmmYS1XZLypvc";
  try {
    const doc = await db.collection("admin_settings").doc("api_keys").get();
    if (doc.exists) {
      const settings = doc.data()?.settings;
      const key = settings?.youtube?.[0]?.api_key || null;
      return key || hardcodedKey;
    }
  } catch (error) {
    // Silent failure, falling back to hardcoded key
  }
  return hardcodedKey;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/youtube/search", async (req, res) => {
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
        console.error("YouTube Search API Error:", data);
        return res.status(response.status).json({ error: "YouTube API Error", details: data });
      }
      res.json(data);
    } catch (error) {
      console.error("Failed to fetch from YouTube:", error);
      res.status(500).json({ error: "Failed to fetch from YouTube" });
    }
  });

  app.get("/api/youtube/video-details", async (req, res) => {
    const videoId = req.query.id as string;
    const apiKey = await getYouTubeApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: "YOUTUBE_API_KEY is not set" });
    }
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`
      );
      const data = await response.json();
      if (!response.ok) {
        console.error("YouTube Video Details API Error:", data);
        return res.status(response.status).json({ error: "YouTube API Error", details: data });
      }
      res.json(data);
    } catch (error) {
      console.error("Failed to fetch video details:", error);
      res.status(500).json({ error: "Failed to fetch video details" });
    }
  });

  // PDF Proxy to bypass CORS and handle Google Drive large files
  app.get("/api/proxy/pdf", async (req, res) => {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    try {
      let response = await fetch(url, { redirect: 'follow' });
      
      // Handle Google Drive's "virus scan" confirmation page for large files
      if (url.includes('drive.google.com') && response.headers.get('content-type')?.includes('text/html')) {
        const html = await response.text();
        const confirmMatch = html.match(/confirm=([a-zA-Z0-9_]+)/);
        if (confirmMatch) {
          const confirmToken = confirmMatch[1];
          const urlObj = new URL(url);
          urlObj.searchParams.set('confirm', confirmToken);
          response = await fetch(urlObj.toString(), { redirect: 'follow' });
        }
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      const buffer = await response.arrayBuffer();
      
      // Ensure we tell the browser it's a PDF
      res.setHeader("Content-Type", contentType?.includes('pdf') ? contentType : "application/pdf");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("PDF Proxy Error:", error);
      res.status(500).json({ error: "Failed to proxy PDF" });
    }
  });

  // Send Notification API
  app.post("/api/send-notification", async (req, res) => {
    const { title, body, token } = req.body;
    if (!title || !body || !token) {
      return res.status(400).json({ error: "Title, body, and token are required" });
    }
    try {
      const message = {
        notification: { title, body },
        token: token,
      };
      const response = await admin.messaging().send(message);
      res.status(200).json({ success: true, messageId: response });
    } catch (error: any) {
      console.error("Failed to send notification:", error);
      res.status(500).json({ 
        error: "Failed to send notification", 
        details: error?.message || String(error),
        code: error?.code
      });
    }
  });

  async function getGeminiApiKey(): Promise<string | null> {
    try {
      const doc = await db.collection("admin_settings").doc("api_keys").get();
      if (doc.exists) {
        const settings = doc.data()?.settings;
        if (settings?.gemini && Array.isArray(settings.gemini) && settings.gemini.length > 0) {
          let activeIndex = settings.active_index || 0;
          if (activeIndex >= settings.gemini.length) {
            activeIndex = 0;
          }
          return settings.gemini[activeIndex].api_key || null;
        }
      }
    } catch (error) {
      console.warn("Error reading custom Gemini API key from Firestore, falling back to system key:", error);
    }
    return process.env.GEMINI_API_KEY || null;
  }

  // Secure Gemini API Proxy
  app.post("/api/gemini", async (req, res) => {
    const { model, contents, config, customApiKey } = req.body;
    
    let apiKey = customApiKey || await getGeminiApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key is not configured" });
    }

    const runGenerate = async (key: string) => {
      const ai = new GoogleGenAI({ apiKey: key }) as any;
      return await ai.models.generateContent({
        model: model || 'gemini-1.5-flash',
        contents,
        config
      });
    };

    try {
      const response = await runGenerate(apiKey);
      res.json({
        ...response,
        text: response.text
      });
    } catch (error: any) {
      console.error("Gemini API Error with primary key:", error);
      
      const isLeaked = error.message?.includes("leaked") || error.status === 403;
      if (isLeaked && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== apiKey) {
        console.warn("Attempting secure fallback to system GEMINI_API_KEY...");
        try {
          const response = await runGenerate(process.env.GEMINI_API_KEY);
          return res.json({
            ...response,
            text: response.text
          });
        } catch (fallbackError: any) {
          console.error("Gemini fallback API Error:", fallbackError);
        }
      }
      
      res.status(error.status || 500).json({ 
        error: "Gemini generation failed", 
        details: error.message || String(error) 
      });
    }
  });

  // Text to Speech (TTS) API
  app.post("/api/tts", async (req, res) => {
    const { text, voice, customApiKey } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    
    let apiKey = customApiKey || await getGeminiApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key is not configured" });
    }

    const runTTS = async (key: string) => {
      const ai = new GoogleGenAI({ apiKey: key }) as any;
      const interaction = await ai.interactions.create({
        model: 'gemini-3.1-flash-tts-preview',
        input: text,
        response_modalities: ['AUDIO'],
        generation_config: {
          speech_config: [
            {
              voice: voice || "kore"
            }
          ]
        }
      });

      let audioData = null;
      for (const step of (interaction.steps || [])) {
        if (step.type === 'model_output') {
          const audioContent = (step.content as any[])?.find((c: any) => c.type === 'audio');
          if (audioContent && audioContent.data) {
            audioData = audioContent.data; // this is base64 string
            break;
          }
        }
      }
      return audioData;
    };

    try {
      const audioData = await runTTS(apiKey);
      if (audioData) {
        return res.json({ audio: audioData });
      } else {
        return res.status(500).json({ error: "No audio generated from the model" });
      }
    } catch (error: any) {
      console.error("TTS API error with primary key:", error);
      
      const isLeaked = error.message?.includes("leaked") || error.status === 403;
      if (isLeaked && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== apiKey) {
        console.warn("Attempting TTS fallback to system GEMINI_API_KEY...");
        try {
          const audioData = await runTTS(process.env.GEMINI_API_KEY);
          if (audioData) {
            return res.json({ audio: audioData });
          }
        } catch (fallbackError: any) {
          console.error("TTS fallback API Error:", fallbackError);
        }
      }
      
      res.status(500).json({ error: "TTS generation failed", details: error.message || String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
