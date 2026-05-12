import { getGroupId } from './group-map.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, message, type } = req.body;
  // type: 'submission'（課題提出通知）| 'reminder'（未提出催促）| undefined（個人メッセージ）

  if (!userId || !message) {
    return res.status(400).json({ error: 'userId と message は必須です' });
  }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const fallbackGroupId = process.env.LINE_GROUP_ID;

  if (!token) {
    return res.status(500).json({ error: 'アクセストークンが設定されていません' });
  }

  async function push(to, text) {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
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
    if (!response.ok) {
      const err = await response.json();
      throw new Error(JSON.stringify(err));
    }
  }

  try {
    await push(userId, message);

    if (type === 'submission' || type === 'reminder' || type === 'correction') {
      const familyGroupId = await getGroupId(userId);
      const groupId = familyGroupId || fallbackGroupId;
      if (groupId) {
        let groupMessage;
        if (type === 'submission') groupMessage = `✅ 課題提出通知\n${message}`;
        else if (type === 'reminder') groupMessage = `⚠️ 未提出催促\n${message}`;
        else groupMessage = message;
        await push(groupId, groupMessage);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
