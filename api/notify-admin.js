import { getGroupId } from './group-map.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, school, grade, date, fileCount, imageUrls, userId } = req.body;
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const adminId = process.env.ADMIN_LINE_USER_ID;
  const fallbackGroupId = process.env.LINE_GROUP_ID;

  if (!token) return res.status(500).json({ error: 'トークン未設定' });

  async function pushMessages(to, messages) {
    if (!to) return;
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ to, messages }),
    });
  }

  const textMsg = { type: 'text', text: `✅ 課題提出通知\n\n${name}（${school} ${grade}）\nが課題を提出しました📚\n\nファイル数：${fileCount}件\n提出日：${date}` };

  const urls = Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : [];
  const imageMessages = urls.slice(0, 4).map(url => ({
    type: 'image',
    originalContentUrl: url,
    previewImageUrl: url,
  }));
  const messages = [textMsg, ...imageMessages];

  // 家庭グループIDをBlobから取得
  const familyGroupId = userId ? await getGroupId(userId) : null;
  const groupId = familyGroupId || fallbackGroupId;

  try {
    await pushMessages(adminId, messages);
    await pushMessages(groupId, messages);

    for (let i = 4; i < urls.length; i += 5) {
      const extra = urls.slice(i, i + 5).map(url => ({
        type: 'image',
        originalContentUrl: url,
        previewImageUrl: url,
      }));
      await pushMessages(adminId, extra);
      await pushMessages(groupId, extra);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
