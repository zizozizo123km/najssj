import { GoogleGenAI } from "@google/genai";
import { getApiKey } from "./apiKeys";

export async function getGeminiClient() {
  const apiKey = await getApiKey('gemini');
  if (!apiKey) {
    throw new Error("Gemini API key is missing in Firestore.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function askAI(prompt: string, context: string = "") {
  const ai = await getGeminiClient();
  const model = "gemini-3.1-flash-lite-preview";

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
