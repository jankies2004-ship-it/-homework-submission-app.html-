export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'アクセストークンが設定されていません' });
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/followers/ids', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    return res.status(200).json({ userIds: data.userIds || [] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
