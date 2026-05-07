export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const events = req.body.events || [];
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  // ユーザーストレージ（KVがないためVercel環境変数は読み取り専用）
  // userIdをログに記録し、フォロー時にウェルカムメッセージを送る
  for (const event of events) {
    if (event.type === 'follow') {
      const userId = event.source.userId;
      console.log('新しいフォロワー userId:', userId);

      // ウェルカムメッセージを送信
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
              text: `【エイメイ英語課題Bot】\n友だち追加ありがとうございます！\n\nあなたのLINE IDは以下です。管理者にお伝えください：\n\n${userId}\n\nこのBotから課題の催促連絡が届きます📚`
            }]
          }),
        });
      }
    }

    // テキストメッセージへの返信
    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;
      const replyToken = event.replyToken;
      const text = event.message.text.trim();

      // 「ID」と送信した時だけuserIdを返信
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
      // それ以外のメッセージには返信しない
    }
  }

  res.status(200).json({ status: 'ok' });
}
