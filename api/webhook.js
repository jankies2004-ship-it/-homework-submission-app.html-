export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const events = req.body.events || [];
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  async function pushMessage(to, text) {
    if (!token || !to) return;
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

  async function replyMessage(replyToken, text) {
    if (!token) return;
    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: 'text', text }],
      }),
    });
  }

  for (const event of events) {
    // 友だち追加
    if (event.type === 'follow') {
      const userId = event.source.userId;
      console.log('新しいフォロワー userId:', userId);
      await pushMessage(
        userId,
        `【エイメイ英語課題Bot】\n友だち追加ありがとうございます！\n\n課題の提出・催促連絡が届きます📚\n\n自分のIDを確認したい場合は「ID」と送信してください。`
      );
    }

    // グループ参加
    if (event.type === 'join') {
      const groupId = event.source.groupId || event.source.roomId;
      console.log('グループ参加 groupId:', groupId);
      // グループにウェルカムメッセージ
      await pushMessage(
        groupId,
        `【エイメイ英語課題Bot】\nグループに参加しました！\n\n課題提出状況の通知と未提出者への催促をお知らせします📚`
      );
      // 管理者にグループIDを通知
      const adminId = process.env.ADMIN_LINE_USER_ID;
      if (adminId) {
        await pushMessage(
          adminId,
          `【Bot管理通知】\nグループに招待されました！\n\nグループID：\n${groupId}\n\nVercelの環境変数 LINE_GROUP_ID にこのIDを設定してください。`
        );
      }
    }

    // テキストメッセージ
    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;
      const replyToken = event.replyToken;
      const text = event.message.text.trim();

      if (text === 'ID' || text === 'id' || text === 'ｉｄ' || text === 'ＩＤ') {
        await replyMessage(
          replyToken,
          `あなたのLINE IDは：\n${userId}\n\n管理者にこのIDをお伝えください。`
        );
      }
    }
  }

  res.status(200).json({ status: 'ok' });
}
