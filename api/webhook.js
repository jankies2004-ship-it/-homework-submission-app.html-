import { kv } from '@vercel/kv';

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
      // 登録待ち状態をKVに保存
      await kv.set(`pending_group:${groupId}`, true, { ex: 86400 }); // 24時間有効
      await pushMessage(
        groupId,
        `【エイメイ英語課題Bot】\nグループに参加しました！\n\n📝 家庭グループとして登録するには：\n生徒本人がこのグループで「登録」と送信してください。\n\n登録すると、課題提出・未提出の通知がこのグループに届きます📚`
      );
      // 管理者にグループIDを通知
      const adminId = process.env.ADMIN_LINE_USER_ID;
      if (adminId) {
        await pushMessage(
          adminId,
          `【Bot管理通知】\nグループに招待されました！\n\nグループID：\n${groupId}\n\n生徒本人がグループで「登録」と送信すると自動で紐づけされます。`
        );
      }
    }

    // テキストメッセージ
    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;
      const groupId = event.source.groupId || event.source.roomId;
      const replyToken = event.replyToken;
      const text = event.message.text.trim();

      // 個人チャットでのIDコマンド
      if (!groupId && (text === 'ID' || text === 'id' || text === 'ｉｄ' || text === 'ＩＤ')) {
        await replyMessage(
          replyToken,
          `あなたのLINE IDは：\n${userId}\n\n管理者にこのIDをお伝えください。`
        );
      }

      // グループ内での「登録」コマンド
      if (groupId && text === '登録') {
        try {
          await kv.set(`user_group:${userId}`, groupId);
          await kv.del(`pending_group:${groupId}`);
          console.log(`グループ登録完了 userId:${userId} groupId:${groupId}`);
          await replyMessage(
            replyToken,
            `✅ 家庭グループとして登録しました！\n\nこれからあなた（userID：${userId}）への課題通知がこのグループにも届きます📚`
          );
          const adminId = process.env.ADMIN_LINE_USER_ID;
          if (adminId) {
            await pushMessage(
              adminId,
              `【Bot管理通知】\n家庭グループが登録されました\n\nuserID：${userId}\nグループID：${groupId}`
            );
          }
        } catch (err) {
          console.error('グループ登録エラー:', err);
          const adminId = process.env.ADMIN_LINE_USER_ID;
          if (adminId) {
            await pushMessage(adminId, `【エラー】グループ登録失敗\n${String(err)}`);
          }
          await replyMessage(replyToken, `登録に失敗しました。しばらく待ってから再度「登録」と送信してください。`);
        }
      }
    }
  }

  res.status(200).json({ status: 'ok' });
}
