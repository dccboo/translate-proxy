export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { text = "", sourceLang = "auto", targetLang = "zh" } = req.body || {};
    if (!text) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({ translated: "" });
    }

    const payload = {
      model: "gpt-4o-mini",
      temperature: 0,
      input: [
        {
          role: "system",
          content: [{
            type: "text",
            text: `你是一个专业翻译，请将任何语言翻译成${targetLang}，要求根据上下文语境翻译，保留英文缩写和某些特定字符；自动过滤链接和@后的用户名、$后面的token代币符号；保持原意不变，流畅自然；`
          }]
        },
        {
          role: "user",
          content: [{
            type: "input_text",
            text: `Source language: ${sourceLang}\nTarget language: ${targetLang}\n\nText:\n${text}`
          }]
        }
      ]
    };

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const err = await r.text();
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(r.status).send(err);
    }

    const data = await r.json();

    // 抽取文本（与前端契约：返回 { translated }）
    let out =
      (typeof data?.output_text === "string" && data.output_text.trim()) ? data.output_text.trim() : "";
    if (!out && Array.isArray(data?.output)) {
      out = data.output.map(x =>
        Array.isArray(x?.content) ? x.content.map(c => c?.text || '').join('') : ''
      ).join('\n').trim();
    }
    if (!out) {
      const cc = (data?.choices?.[0]?.message?.content) || (data?.choices?.[0]?.text);
      if (typeof cc === 'string' && cc.trim()) out = cc.trim();
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify({ translated: out || "" }));
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).send(String(e));
  }
}