'use strict';
const crypto = require('crypto');
const paths = require('./paths');
const store = require('./store');

const API = process.env.DEX_API_BASE || 'https://api.spotify.com/v1';
const ACCOUNTS = process.env.DEX_ACCOUNTS_BASE || 'https://accounts.spotify.com';
// Read-only: the dex never controls playback.
const SCOPES = ['user-read-currently-playing', 'user-read-recently-played'];

function readConfig() {
  return store.readJson(paths.configFile(), null);
}

function isConfigured() {
  const c = readConfig();
  return Boolean(c && c.clientId && c.refreshToken);
}

async function postToken(params) {
  const res = await fetch(`${ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
    signal: AbortSignal.timeout(8000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`token ${res.status}: ${body.error_description || body.error || ''}`);
  return body;
}

function saveTokens(tokens) {
  return store.update(paths.configFile(), 'config', () => ({}), (c) => {
    c.accessToken = tokens.access_token;
    // PKCE refresh tokens can rotate; keep the old one if none is returned.
    if (tokens.refresh_token) c.refreshToken = tokens.refresh_token;
    c.expiresAt = Date.now() + (tokens.expires_in || 3600) * 1000;
    return { ...c };
  });
}

async function accessToken({ force = false } = {}) {
  const c = readConfig();
  if (!c || !c.refreshToken) throw new Error('not configured: run dex setup');
  if (!force && c.accessToken && c.expiresAt - 60000 > Date.now()) return c.accessToken;
  const tokens = await postToken({
    grant_type: 'refresh_token',
    refresh_token: c.refreshToken,
    client_id: c.clientId,
  });
  return saveTokens(tokens).accessToken;
}

async function apiGet(pathAndQuery) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await accessToken({ force: attempt > 0 });
    const res = await fetch(`${API}${pathAndQuery}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 401 && attempt === 0) continue;
    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`GET ${pathAndQuery} -> ${res.status}`);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
  return null;
}

async function currentlyPlaying() {
  const body = await apiGet('/me/player/currently-playing');
  if (!body || !body.item) return { playing: false, item: null };
  return { playing: Boolean(body.is_playing), item: body.item };
}

async function recentlyPlayed(afterMs) {
  const q = new URLSearchParams({ limit: '50' });
  if (afterMs) q.set('after', String(Math.floor(afterMs)));
  const body = await apiGet(`/me/player/recently-played?${q}`);
  return (body && body.items) || [];
}

function pkcePair() {
  const verifier = crypto.randomBytes(64).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

function authorizeUrl({ clientId, redirectUri, challenge, state }) {
  const q = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SCOPES.join(' '),
    state,
  });
  return `${ACCOUNTS}/authorize?${q}`;
}

module.exports = {
  SCOPES,
  readConfig,
  isConfigured,
  postToken,
  saveTokens,
  accessToken,
  currentlyPlaying,
  recentlyPlayed,
  pkcePair,
  authorizeUrl,
};
