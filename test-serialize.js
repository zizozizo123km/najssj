const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({apiKey: 'foo'});
console.log(JSON.stringify(ai.models.generateContent({})));
