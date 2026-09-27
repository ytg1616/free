'use strict';
const test = require('node:test');
const assert = require('node:assert');
const game = require('../scripts/lib/game');

const track = (id) => ({ id, name: `song ${id}`, artists: [{ id: 'a', name: 'Artist' }], album: null });

test('levels follow distinct coding days', () => {
  assert.strictEqual(game.levelOf(0), 0);
  assert.strictEqual(game.levelOf(1), 1);
  assert.strictEqual(game.levelOf(2), 1);
  assert.strictEqual(game.levelOf(3), 2);
  assert.strictEqual(game.levelOf(7), 3);
  assert.strictEqual(game.levelOf(20), 4);
  assert.strictEqual(game.levelName(4), 'OST');
  assert.deepStrictEqual(game.nextLevel(6), { level: 3, name: '전우', remaining: 1 });
  assert.strictEqual(game.nextLevel(25), null);
});

test('capture: new, same-day repeat, level up on third day', () => {
  const db = game.emptyDb();
  const at = '2026-09-27T01:00:00.000Z';
  assert.strictEqual(game.capture(db, track('x'), { day: '2026-09-25', at, repo: 'free' }).type, 'new');
  assert.strictEqual(game.capture(db, track('x'), { day: '2026-09-25', at, repo: 'free' }), null);
  assert.strictEqual(game.capture(db, track('x'), { day: '2026-09-26', at, repo: 'other' }), null);
  const ev = game.capture(db, track('x'), { day: '2026-09-27', at, repo: 'free' });
  assert.deepStrictEqual(ev, { type: 'levelup', trackId: 'x', level: 2, at });
  const card = db.tracks.x;
  assert.strictEqual(card.days.length, 3);
  assert.strictEqual(card.turns, 4);
  assert.deepStrictEqual(card.repos, { free: 3, other: 1 });
});

test('streak counts back from today or yesterday', () => {
  const db = game.emptyDb();
  db.activeDays = ['2026-09-25', '2026-09-26', '2026-09-27'];
  assert.strictEqual(game.streak(db, '2026-09-27'), 3);
  assert.strictEqual(game.streak(db, '2026-09-28'), 3);
  assert.strictEqual(game.streak(db, '2026-09-29'), 0);
  db.activeDays = ['2026-02-28', '2026-03-01'];
  assert.strictEqual(game.streak(db, '2026-03-01'), 2);
});

test('simplifyTrack skips episodes and local files', () => {
  assert.strictEqual(game.simplifyTrack({ type: 'episode', id: 'e' }), null);
  assert.strictEqual(game.simplifyTrack({ type: 'track', id: null }), null);
  assert.deepStrictEqual(
    game.simplifyTrack({ type: 'track', id: 't', name: 'n', artists: [{ id: 'a', name: 'A', extra: 1 }], album: { id: 'b', name: 'B' } }),
    { id: 't', name: 'n', artists: [{ id: 'a', name: 'A' }], album: { id: 'b', name: 'B' } },
  );
});
