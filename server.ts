import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

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
