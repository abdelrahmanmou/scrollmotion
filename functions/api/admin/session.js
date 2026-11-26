import { json } from '../../_lib/auth.js';

// Reaching here means the middleware accepted the session cookie
export function onRequestGet() {
  return json({ ok: true });
}
