'use strict';

// Track cards level up by the number of distinct days you coded with them.
// Counting days (not turns) keeps the numbers from inflating when turns are short.
const LEVELS = [
  { min: 1, name: '만남' },
  { min: 3, name: '동료' },
  { min: 7, name: '전우' },
  { min: 20, name: 'OST' },
];

function levelOf(days) {
  let lv = 0;
  LEVELS.forEach((l, i) => {
    if (days >= l.min) lv = i + 1;
  });
  return lv;
}

function levelName(lv) {
  return lv > 0 ? LEVELS[lv - 1].name : '미포획';
}

function nextLevel(days) {
  const lv = levelOf(days);
  return lv < LEVELS.length ? { level: lv + 1, name: LEVELS[lv].name, remaining: LEVELS[lv].min - days } : null;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

// Local calendar day, so "a day" matches the user's clock (KST etc).
function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function prevDayKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d - 1));
}

function emptyDb() {
  return { version: 1, tracks: {}, activeDays: [], events: [] };
}

function simplifyTrack(item) {
  if (!item || item.type !== 'track' || !item.id) return null;
  return {
    id: item.id,
    name: item.name,
    artists: (item.artists || []).map((a) => ({ id: a.id, name: a.name })),
    album: item.album ? { id: item.album.id, name: item.album.name } : null,
  };
}

function capture(db, track, { day, at, repo }) {
  let card = db.tracks[track.id];
  const isNew = !card;
  if (isNew) {
    card = { ...track, firstCaptured: at, days: [], turns: 0, repos: {} };
    db.tracks[track.id] = card;
  } else {
    Object.assign(card, { name: track.name, artists: track.artists, album: track.album });
  }
  const before = levelOf(card.days.length);
  if (!card.days.includes(day)) card.days.push(day);
  card.turns += 1;
  if (repo) card.repos[repo] = (card.repos[repo] || 0) + 1;
  card.lastCaptured = at;
  const after = levelOf(card.days.length);

  if (isNew) return { type: 'new', trackId: track.id, level: after, at };
  if (after > before) return { type: 'levelup', trackId: track.id, level: after, at };
  return null;
}

function markActiveDay(db, day) {
  if (!db.activeDays.includes(day)) db.activeDays.push(day);
}

function pushEvents(db, events) {
  db.events.push(...events);
  if (db.events.length > 50) db.events.splice(0, db.events.length - 50);
}

// Consecutive coding days ending today (or yesterday, so the streak
// doesn't show 0 before the first turn of the day).
function streak(db, today = dayKey()) {
  const days = new Set(db.activeDays);
  let cursor = days.has(today) ? today : prevDayKey(today);
  let n = 0;
  while (days.has(cursor)) {
    n += 1;
    cursor = prevDayKey(cursor);
  }
  return n;
}

function artistLine(card) {
  return (card.artists || []).map((a) => a.name).join(', ');
}

module.exports = {
  LEVELS,
  levelOf,
  levelName,
  nextLevel,
  dayKey,
  prevDayKey,
  emptyDb,
  simplifyTrack,
  capture,
  markActiveDay,
  pushEvents,
  streak,
  artistLine,
};
