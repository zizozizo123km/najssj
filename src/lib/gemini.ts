import { GoogleGenAI } from "@google/genai";
import { db, doc, getDoc, updateDoc } from './firebase';

export async function getGeminiConfig() {
  try {
    const docRef = doc(db, 'admin_settings', 'api_keys');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const settings = data.settings;
      if (settings.gemini && Array.isArray(settings.gemini) && settings.gemini.length > 0) {
        let activeIndex = settings.active_index || 0;
        
        // Ensure index is valid
        if (activeIndex >= settings.gemini.length) {
            activeIndex = 0;
        }

        const selected = settings.gemini[activeIndex];
        
        return {
          client: new GoogleGenAI({ apiKey: selected.api_key }),
          model: selected.model_name || 'gemini-1.5-flash',
          activeIndex,
          allSettings: settings
        };
      }
    }
  } catch (error) {
    console.error("Error fetching Gemini config:", error);
  }
  throw new Error("Gemini API key is missing or invalid in Firestore.");
}

async function rotateKey(currentIndex: number, allSettings: any) {
    const nextIndex = (currentIndex + 1) % allSettings.gemini.length;
    await updateDoc(doc(db, 'admin_settings', 'api_keys'), {
        'settings.active_index': nextIndex
    });
    return nextIndex;
}

export async function askAI(prompt: string, context: string = "", retryCount: number = 0) {
  const { client: ai, model, activeIndex, allSettings } = await getGeminiConfig();

  const systemInstruction = `
    You are an AI assistant for Algerian Baccalaureate students. 
    Your goal is to help them with their studies, explain lessons, solve exercises, and provide summaries.
    Always respond in Arabic (Algerian dialect or Modern Standard Arabic as appropriate) or French if the subject is taught in French.
    Be encouraging, clear, and concise.
    ${context ? `Extra context provided: ${context}` : ''}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    return response.text;
  } catch (error: any) {
    // Check if it's a rate limit error (429) or other quota limits
    if ((error.status === 429 || error.message?.includes('quota')) && retryCount < allSettings.gemini.length - 1) {
        console.warn(`Rate limit reached for key index ${activeIndex}, rotating...`);
        await rotateKey(activeIndex, allSettings);
        return askAI(prompt, context, retryCount + 1);
    }
    
    // If we've exhausted all Gemini keys or it's a critical error, try OpenRouter fallback
    console.warn("Gemini Error or exhausted. Trying OpenRouter Fallback...", error.message);
    try {
        return await askOpenRouter(prompt, systemInstruction, allSettings);
    } catch (fallbackError: any) {
        console.error("Critical AI Failure (Gemini and OpenRouter):", fallbackError);
        throw error; // Throw original error if fallback also fails
    }
  }
}

async function askOpenRouter(prompt: string, systemInstruction: string, allSettings: any) {
  const settings = allSettings.openrouter;
  if (!settings || !Array.isArray(settings) || settings.length === 0 || !settings[0].api_key) {
    throw new Error("OpenRouter settings missing or invalid.");
  }

  const selected = settings[0];
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${selected.api_key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin, // Required by OpenRouter potentially
      "X-Title": "Bac DZ App"
    },
    body: JSON.stringify({
      "model": selected.model_name || "google/gemini-2.0-flash-exp:free",
      "messages": [
        {"role": "system", "content": systemInstruction},
        {"role": "user", "content": prompt}
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'OpenRouter Fallback Failed');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
