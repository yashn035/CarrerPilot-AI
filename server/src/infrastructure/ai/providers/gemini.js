import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export async function callGemini(prompt, systemPrompt = '') {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

  const payload = {
    contents: [{
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    }
  };

  const response = await axios.post(GEMINI_URL, payload, { timeout: 10000 });
  return response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
}
