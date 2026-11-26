// Session handling for the portfolio CMS.
//
// The only credential is the ADMIN_PASSWORD secret set in Cloudflare Pages
// (Settings → Variables and secrets). A successful login sets an HttpOnly
// cookie holding an expiry time signed with that password, so changing the
// password signs everyone out.

const enc = new TextEncoder();
export const COOKIE = 'sm_admin';
const SESSION_DAYS = 30;

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sameString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return '';
}

export async function passwordMatches(env, attempt) {
  if (!env.ADMIN_PASSWORD || typeof attempt !== 'string') return false;
  // Compare fixed-length digests so the time taken says nothing about the password
  const [a, b] = await Promise.all([
    hmac('pw-check', attempt),
    hmac('pw-check', env.ADMIN_PASSWORD),
  ]);
  return sameString(a, b);
}

export async function sessionCookie(env) {
  const exp = String(Date.now() + SESSION_DAYS * 864e5);
  const sig = await hmac(`${env.ADMIN_PASSWORD}|session`, exp);
  return `${COOKIE}=${exp}.${sig}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}`;
}

export const clearedCookie = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export async function isAuthed(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const [exp, sig] = readCookie(request, COOKIE).split('.');
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  return sameString(sig, await hmac(`${env.ADMIN_PASSWORD}|session`, exp));
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}
