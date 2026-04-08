import { GoogleGenAI } from "@google/genai";
import { db, doc, getDoc } from './firebase';

export async function getGeminiConfig() {
  try {
    const docRef = doc(db, 'admin_settings', 'api_keys');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const settings = docSnap.data().settings;
      if (settings.gemini && Array.isArray(settings.gemini) && settings.gemini.length > 0) {
        const validKeys = settings.gemini.filter((k: any) => k.api_key && k.api_key.trim() !== '');
        if (validKeys.length > 0) {
          const randomIndex = Math.floor(Math.random() * validKeys.length);
          const selected = validKeys[randomIndex];
          return {
            client: new GoogleGenAI({ apiKey: selected.api_key }),
            model: selected.model_name || 'gemini-2.5-flash'
          };
        }
      }
    }
  } catch (error) {
    console.error("Error fetching Gemini config:", error);
  }
  throw new Error("Gemini API key is missing in Firestore.");
}

export async function getGeminiClient() {
  const { client } = await getGeminiConfig();
  return client;
}

export async function askAI(prompt: string, context: string = "") {
  const { client: ai, model } = await getGeminiConfig();

  const systemInstruction = `
    You are an AI assistant for Algerian Baccalaureate students. 
    Your goal is to help them with their studies, explain lessons, solve exercises, and provide summaries.
    Always respond in Arabic (Algerian dialect or Modern Standard Arabic as appropriate) or French if the subject is taught in French.
    Be encouraging, clear, and concise.
    Context from the current chat: ${context}
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
  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
}
