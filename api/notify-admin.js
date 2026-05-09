export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, school, grade, date, fileCount } = req.body;
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const adminId = process.env.ADMIN_LINE_USER_ID;
  const groupId = process.env.LINE_GROUP_ID;

  if (!token) return res.status(500).json({ error: 'トークン未設定' });

  async function push(to, text) {
    if (!to) return;
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        to,
        messages: [{ type: 'text', text }],
      }),
    });
  }

  const msg = `✅ 課題提出通知\n\n${name}（${school} ${grade}）\nが課題を提出しました📚\n\nファイル数：${fileCount}件\n提出日：${date}`;

  try {
    await push(adminId, msg);
    await push(groupId, msg);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
