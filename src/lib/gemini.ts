import { GoogleGenAI } from "@google/genai";
import { db, doc, getDoc, updateDoc } from './firebase';

export async function getGeminiConfig() {
  let customApiKey: string | undefined;
  let customModel = "gemini-1.5-flash";
  let activeIndex = 0;
  let allSettings: any = {};

  try {
    const docRef = doc(db, 'admin_settings', 'api_keys');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const settings = data.settings;
      if (settings?.gemini && Array.isArray(settings.gemini) && settings.gemini.length > 0) {
        activeIndex = settings.active_index || 0;
        if (activeIndex >= settings.gemini.length) {
            activeIndex = 0;
        }
        const selected = settings.gemini[activeIndex];
        customApiKey = selected.api_key;
        if (selected.model_name) {
            customModel = selected.model_name;
        }
        allSettings = settings;
      }
    }
  } catch (error) {
    console.warn("Could not fetch custom Gemini settings from client:", error);
  }

  // Return a mocked secure client that proxies all requests to the backend /api/gemini endpoint
  const mockClient = {
    models: {
      generateContent: async (args: any) => {
        try {
          const res = await fetch("/api/gemini", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ ...args, customApiKey })
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || errData.details || "Failed to generate content");
          }
          return await res.json();
        } catch (error: any) {
          console.warn("Proxied generateContent error, attempting OpenRouter fallback:", error);
          if (allSettings && allSettings.openrouter && allSettings.openrouter.length > 0) {
            try {
              // Create a simplified prompt from contents
              let prompt = "";
              if (args.contents && Array.isArray(args.contents)) {
                 prompt = args.contents.map((c: any) => c.parts.map((p: any) => p.text).join(" ")).join("\n");
              } else if (typeof args.contents === "string") {
                 prompt = args.contents;
              }
              const systemInstruction = args.config?.systemInstruction || "";
              
              // Only fallback if we have a prompt
              if (prompt) {
                 const fallbackText = await askOpenRouter(prompt, systemInstruction, allSettings);
                 return { text: fallbackText };
              }
            } catch (fallbackError) {
              console.error("OpenRouter fallback also failed:", fallbackError);
            }
          }
          throw error;
        }
      }
    },
    chats: {
      create: (chatArgs: any) => {
        const history: any[] = chatArgs?.history || [];
        const systemInstruction = chatArgs?.config?.systemInstruction;
        const model = chatArgs?.model || customModel;
        
        return {
          sendMessage: async (sendArgs: any) => {
            const messageText = typeof sendArgs === "string" ? sendArgs : sendArgs.message;
            
            const contents = [
              ...history,
              { role: "user", parts: [{ text: messageText }] }
            ];
            
            const config: any = {};
            if (systemInstruction) {
              config.systemInstruction = systemInstruction;
            }
            if (chatArgs?.config?.temperature !== undefined) {
              config.temperature = chatArgs.config.temperature;
            }
            
            try {
              const res = await fetch("/api/gemini", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  model: model,
                  contents,
                  config,
                  customApiKey
                })
              });
              
              if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || errData.details || "Failed to send message");
              }
              
              const responseData = await res.json();
              
              history.push({ role: "user", parts: [{ text: messageText }] });
              history.push({ role: "model", parts: [{ text: responseData.text }] });
              
              return responseData;
            } catch (error: any) {
              console.error("Proxied sendMessage error:", error);
              throw error;
            }
          }
        };
      }
    }
  };

  return {
    client: mockClient as any,
    model: customModel,
    activeIndex,
    allSettings,
    customApiKey
  };
}

export async function askAI(prompt: string, context: string = "") {
  const { client: ai, model } = await getGeminiConfig();

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
    console.warn("Gemini Error. Trying OpenRouter Fallback...", error.message);
    try {
        // Fallback to OpenRouter via client-side fetch using user settings if available
        const docRef = doc(db, 'admin_settings', 'api_keys');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const settings = docSnap.data().settings;
          return await askOpenRouter(prompt, systemInstruction, settings);
        }
    } catch (fallbackError: any) {
        console.error("Critical AI Failure (Gemini and OpenRouter):", fallbackError);
    }
    throw error;
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
      "HTTP-Referer": window.location.origin,
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
