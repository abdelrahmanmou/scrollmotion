// Telegram alerts. The bot token is the TELEGRAM_BOT_TOKEN secret in Cloudflare
// Pages; the chat to send to is found by "Connect" in the admin and kept in D1.
import { getSetting } from './track.js';

export async function tg(env, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) throw new Error(data.description || `Telegram error ${res.status}`);
  return data.result;
}

export async function sendAlert(env, text) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.DB) return false;
  const chat = await getSetting(env.DB, 'telegram_chat');
  if (!chat) return false;
  await tg(env, 'sendMessage', { chat_id: chat, text, disable_web_page_preview: true });
  return true;
}
