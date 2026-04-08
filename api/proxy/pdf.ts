import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    
    res.setHeader("Content-Type", contentType?.includes('pdf') ? contentType : "application/pdf");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("PDF Proxy Error:", error);
    res.status(500).json({ error: "Failed to proxy PDF" });
  }
}
