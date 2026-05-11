import { put } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { dataUrl, filename } = req.body;
  if (!dataUrl || !filename) {
    return res.status(400).json({ error: 'dataUrl と filename は必須です' });
  }

  const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches) {
    return res.status(400).json({ error: '無効なdataUrl形式です' });
  }

  const mimeType = matches[1];
  if (!mimeType.startsWith('image/')) {
    return res.status(400).json({ error: '画像ファイルのみ対応しています' });
  }

  const buffer = Buffer.from(matches[2], 'base64');
  const timestamp = Date.now();
  const safeName = `hw_${timestamp}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  try {
    const blob = await put(safeName, buffer, { access: 'public', contentType: mimeType });
    return res.status(200).json({ url: blob.url });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
