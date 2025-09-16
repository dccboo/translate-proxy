// api/translate.js
export default async function handler(req, res) {
  // CORS 允许本地 file:// 打开测试页
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { text = '', sourceLang = 'auto', targetLang = 'zh' } = req.body || {};
    if (!text) return res.status(200).json({ translated: '' });

    // ⚠️ Responses API：所有 content 都用 input_text
    const payload = {
      model: 'gpt-4o-mini',
      temperature: 0,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text:
                `你是一个专业翻译，请将任何语言翻译成${targetLang}，` +
                `要求根据上下文语境翻译，保留英文缩写和某些特定字符；` +
                `自动过滤链接和@后的用户名、$后面的token代币符号；保持原意不变，流畅自然；`
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                `Source language: ${sourceLang}\n` +
                `Target language: ${targetLang}\n\n` +
                `Text:\n${text}`
            }
          ]
        }
      ]
    };

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(r.status).send(err);
    }

    const data = await r
