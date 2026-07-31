import axios from 'axios';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';

export async function callClaude(prompt, systemPrompt = '') {
  if (!CLAUDE_API_KEY) throw new Error('CLAUDE_API_KEY not set');

  const payload = {
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }]
  };

  const response = await axios.post(CLAUDE_URL, payload, {
    headers: {
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    timeout: 15000
  });
  return response.data.content?.[0]?.text || 'No response';
}
