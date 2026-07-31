import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export async function callOpenAI(prompt, systemPrompt = '') {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');

  const payload = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    max_tokens: 1024,
    temperature: 0.7,
  };

  const response = await axios.post(OPENAI_URL, payload, {
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 15000
  });
  return response.data.choices?.[0]?.message?.content || 'No response';
}
