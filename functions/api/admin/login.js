import { passwordMatches, sessionCookie, clearedCookie, json } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  let body = {};
  try { body = await request.json(); } catch { /* empty body */ }
  if (await passwordMatches(env, body.password)) {
    return json({ ok: true }, 200, { 'set-cookie': await sessionCookie(env) });
  }
  // Slow down guessing
  await new Promise(r => setTimeout(r, 800));
  return json({ error: 'Wrong password' }, 401);
}

export function onRequestDelete() {
  return json({ ok: true }, 200, { 'set-cookie': clearedCookie });
}
