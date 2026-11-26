// Admin: Telegram alert setup.
//   GET                          → { token, connected, bot }
//   POST { action: 'connect' }   → finds the chat you messaged the bot from and saves it
//   POST { action: 'test' }      → sends a test alert
//   POST { action: 'disconnect' }
import { json } from '../../_lib/auth.js';
import { ensureSchema, getSetting, setSetting } from '../../_lib/track.js';
import { tg, sendAlert } from '../../_lib/telegram.js';

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ error: 'Tracking database is not connected.' }, 503);
  await ensureSchema(env.DB);
  const token = !!env.TELEGRAM_BOT_TOKEN;
  let bot = null;
  if (token) {
    try { bot = (await tg(env, 'getMe')).username; } catch (e) { return json({ token, connected: false, error: `The bot token didn't work: ${e.message}` }); }
  }
  const chat = await getSetting(env.DB, 'telegram_chat');
  return json({ token, bot, connected: !!(token && chat), chatName: await getSetting(env.DB, 'telegram_chat_name') });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'Tracking database is not connected.' }, 503);
  if (!env.TELEGRAM_BOT_TOKEN) return json({ error: 'Add the TELEGRAM_BOT_TOKEN secret in Cloudflare first.' }, 400);
  await ensureSchema(env.DB);
  const { action } = await request.json().catch(() => ({}));

  try {
    if (action === 'connect') {
      const updates = await tg(env, 'getUpdates', { limit: 100, allowed_updates: ['message'] });
      const msg = updates.map(u => u.message).filter(m => m && m.chat && m.chat.type === 'private').pop();
      if (!msg) return json({ error: 'No message found yet. Open your bot in Telegram, press Start (or send it any message), then try again.' }, 404);
      const name = [msg.chat.first_name, msg.chat.last_name].filter(Boolean).join(' ') || msg.chat.username || 'you';
      await setSetting(env.DB, 'telegram_chat', String(msg.chat.id));
      await setSetting(env.DB, 'telegram_chat_name', name);
      await tg(env, 'sendMessage', { chat_id: msg.chat.id, text: '✅ Connected. You\'ll get a message here whenever someone opens one of your portfolio links.' });
      return json({ ok: true, chatName: name });
    }
    if (action === 'test') {
      const sent = await sendAlert(env, '👀 Test alert: this is what you\'ll see when a client opens one of your links.');
      return sent ? json({ ok: true }) : json({ error: 'Not connected yet' }, 400);
    }
    if (action === 'disconnect') {
      await setSetting(env.DB, 'telegram_chat', null);
      await setSetting(env.DB, 'telegram_chat_name', null);
      return json({ ok: true });
    }
  } catch (e) {
    return json({ error: e.message }, 502);
  }
  return json({ error: 'Unknown action' }, 400);
}
