export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const events = req.body.events || [];
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  for (const event of events) {
    if (event.type === 'follow') {
      const userId = event.source.userId;
      if (token) {
        await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: userId,
            messages: [{
              type: 'text',
              text: `【エイメイ英語課題Bot】\n友だち追加ありがとうございます！\n\n課題の提出催促連絡が届きます📚\n\n自分のIDを確認したい場合は「ID」と送信してください。`
            }]
          }),
        });
      }
    }

    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;
      const replyToken = event.replyToken;
      const text = event.message.text.trim();

      if (text === 'ID' || text === 'id' || text === 'ｉｄ' || text === 'ＩＤ') {
        if (token) {
          await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              replyToken,
              messages: [{
                type: 'text',
                text: `あなたのLINE IDは：\n${userId}\n\n管理者にこのIDをお伝えください。`
              }]
            }),
          });
        }
      }
    }
  }

  res.status(200).json({ status: 'ok' });
}
