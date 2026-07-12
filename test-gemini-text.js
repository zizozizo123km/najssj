const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({apiKey: 'foo'});
const response = {
  text: "Hello"
};
console.log(typeof response.text);
