'use strict';
// End-to-end: hooks -> capture -> statusline -> report, against a mock Spotify API.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const DEX = path.join(__dirname, '..', 'scripts', 'dex.js');

const mkTrack = (id, name, artist) => ({
  type: 'track',
  id,
  name,
  artists: [{ id: `ar-${artist}`, name: artist }],
  album: { id: `al-${id}`, name: `album ${id}` },
});

function startMock(state) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    state.calls.push(url.pathname);
    const json = (code, body) => {
      res.writeHead(code, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    if (url.pathname === '/api/token') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        state.tokenRequests.push(new URLSearchParams(body));
        json(200, { access_token: 'fresh-token', expires_in: 3600, refresh_token: 'rotated-refresh' });
      });
      return;
    }
    if (req.headers.authorization !== `Bearer ${state.validToken}`) return json(401, { error: 'expired' });
    if (url.pathname === '/v1/me/player/currently-playing') {
      if (!state.current) return res.writeHead(204).end();
      return json(200, { is_playing: true, item: state.current });
    }
    if (url.pathname === '/v1/me/player/recently-played') {
      state.recentAfter = url.searchParams.get('after');
      return json(200, { items: state.recent });
    }
    json(404, {});
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function run(args, env, input = '') {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [DEX, ...args], { env: { ...process.env, ...env } });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, out, err }));
    child.stdin.end(input);
  });
}

test('turn capture flow', async (t) => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'dex-'));
  const state = {
    calls: [],
    tokenRequests: [],
    validToken: 'valid-token',
    current: mkTrack('b', 'Current Song', 'Beta'),
    recent: [],
  };
  const server = await startMock(state);
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const env = {
    DEX_HOME: home,
    DEX_SYNC: '1',
    DEX_API_BASE: `${base}/v1`,
    DEX_ACCOUNTS_BASE: base,
    DEX_CLAUDE_SETTINGS: path.join(home, 'claude-settings.json'),
  };
  const readDb = () => JSON.parse(fs.readFileSync(path.join(home, 'db.json'), 'utf8'));

  // not configured: hooks are silent no-ops, statusline hints setup
  let r = await run(['hook', 'prompt'], env, JSON.stringify({ session_id: 's1', cwd: '/w/free' }));
  assert.strictEqual(r.code, 0);
  assert.strictEqual(r.out, '');
  r = await run(['statusline'], env, '{}');
  assert.match(r.out, /dex-setup/);

  fs.writeFileSync(
    path.join(home, 'config.json'),
    JSON.stringify({ clientId: 'cid', refreshToken: 'r1', accessToken: 'valid-token', expiresAt: Date.now() + 3600e3 }),
  );

  // turn 1: song b playing at start; song a finishes during the turn; b still playing at stop
  r = await run(['hook', 'prompt'], env, JSON.stringify({ session_id: 's1', cwd: '/w/free', prompt: 'hi' }));
  assert.strictEqual(r.out, '', 'UserPromptSubmit stdout would leak into Claude context');
  const turnStart = JSON.parse(fs.readFileSync(path.join(home, 'state.json'), 'utf8')).turns.s1.start;
  state.recent = [
    { track: mkTrack('a', 'Earlier Song', 'Alpha'), played_at: new Date(turnStart + 1000).toISOString() },
    { track: mkTrack('old', 'Before Turn', 'Old'), played_at: new Date(turnStart - 60000).toISOString() },
  ];
  r = await run(['hook', 'stop'], env, JSON.stringify({ session_id: 's1', cwd: '/w/free' }));
  assert.strictEqual(r.code, 0);

  let db = readDb();
  assert.deepStrictEqual(Object.keys(db.tracks).sort(), ['a', 'b']);
  assert.strictEqual(db.tracks.b.repos.free, 1);
  assert.strictEqual(db.events.filter((e) => e.type === 'new').length, 2);
  assert.ok(Number(state.recentAfter) === turnStart);
  const st = JSON.parse(fs.readFileSync(path.join(home, 'state.json'), 'utf8'));
  assert.strictEqual(st.turns.s1, undefined, 'finished turn is cleared');

  // statusline: current song card + dex count + streak + NEW flash
  r = await run(['statusline'], env, '{}');
  assert.match(r.out, /Beta — Current Song \[만남 Lv1 · 1일\]/);
  assert.match(r.out, /📖 2/);
  assert.match(r.out, /🔥 1일/);
  assert.match(r.out, /✨NEW/);

  // plain mode for terminals without emoji
  r = await run(['statusline'], { ...env, DEX_PLAIN: '1' }, '{}');
  assert.match(r.out, /dex 2/);

  // report
  r = await run(['report'], env);
  assert.match(r.out, /2곡 · 아티스트 2명/);
  assert.match(r.out, /오늘 포획 2곡 \(신규 2\)/);

  // expired access token -> refresh with rotation, then capture still works
  state.validToken = 'fresh-token';
  state.recent = [];
  fs.writeFileSync(
    path.join(home, 'config.json'),
    JSON.stringify({ clientId: 'cid', refreshToken: 'r1', accessToken: 'stale', expiresAt: Date.now() - 1 }),
  );
  await run(['hook', 'prompt'], env, JSON.stringify({ session_id: 's2', cwd: 'C:\\Users\\me\\proj x' }));
  await run(['hook', 'stop'], env, JSON.stringify({ session_id: 's2', cwd: 'C:\\Users\\me\\proj x' }));
  const cfg = JSON.parse(fs.readFileSync(path.join(home, 'config.json'), 'utf8'));
  assert.strictEqual(cfg.accessToken, 'fresh-token');
  assert.strictEqual(cfg.refreshToken, 'rotated-refresh');
  assert.strictEqual(state.tokenRequests[0].get('grant_type'), 'refresh_token');
  db = readDb();
  assert.strictEqual(db.tracks.b.turns, 2);
  assert.strictEqual(db.tracks.b.repos['proj x'], 1, 'Windows cwd basename');
  assert.strictEqual(db.tracks.b.days.length, 1, 'same day does not level up');

  // install-statusline writes a forward-slash launcher command, refuses to clobber others
  fs.writeFileSync(env.DEX_CLAUDE_SETTINGS, JSON.stringify({ statusLine: { type: 'command', command: 'other' }, model: 'x' }));
  r = await run(['install-statusline'], env);
  assert.strictEqual(r.code, 1);
  r = await run(['install-statusline', '--force'], env);
  assert.strictEqual(r.code, 0);
  const settings = JSON.parse(fs.readFileSync(env.DEX_CLAUDE_SETTINGS, 'utf8'));
  assert.strictEqual(settings.model, 'x');
  assert.match(settings.statusLine.command, /^node ".*\/dex\.js" statusline$/);
  assert.ok(fs.existsSync(`${env.DEX_CLAUDE_SETTINGS}.dex-backup`));

  // launcher forwards to the real script
  const launched = await new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(home, 'dex.js'), 'report'], { env: { ...process.env, ...env } });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.on('close', () => resolve(out));
  });
  assert.match(launched, /코딩 사운드트랙 도감/);
});

test('hook never fails when Spotify is unreachable', async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'dex-'));
  fs.writeFileSync(
    path.join(home, 'config.json'),
    JSON.stringify({ clientId: 'cid', refreshToken: 'r1', accessToken: 't', expiresAt: Date.now() + 3600e3 }),
  );
  const env = { DEX_HOME: home, DEX_SYNC: '1', DEX_API_BASE: 'http://127.0.0.1:9/v1' };
  const r = await run(['hook', 'stop'], env, JSON.stringify({ session_id: 's', cwd: '/w' }));
  assert.strictEqual(r.code, 0);
  assert.strictEqual(r.out, '');
  assert.match(fs.readFileSync(path.join(home, 'dex.log'), 'utf8'), /worker stop/);
});
