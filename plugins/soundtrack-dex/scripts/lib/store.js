'use strict';
const fs = require('fs');
const paths = require('./paths');

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function ensureHome() {
  fs.mkdirSync(paths.dexHome(), { recursive: true });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

// Windows can reject a rename with EPERM/EBUSY while another process
// (e.g. the statusline) has the target open, so retry briefly.
function writeJson(file, data) {
  ensureHome();
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  for (let i = 0; ; i++) {
    try {
      fs.renameSync(tmp, file);
      return;
    } catch (err) {
      if (i >= 20 || !['EPERM', 'EBUSY', 'EACCES'].includes(err.code)) {
        try { fs.unlinkSync(tmp); } catch {}
        throw err;
      }
      sleepSync(25);
    }
  }
}

// Cross-process lock around a synchronous read-modify-write.
function withLock(name, fn, { timeoutMs = 3000, staleMs = 10000 } = {}) {
  ensureHome();
  const lock = paths.lockFile(name);
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      fs.closeSync(fs.openSync(lock, 'wx'));
      break;
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      try {
        if (Date.now() - fs.statSync(lock).mtimeMs > staleMs) fs.unlinkSync(lock);
      } catch {}
      if (Date.now() > deadline) throw new Error(`lock timeout: ${name}`);
      sleepSync(30);
    }
  }
  try {
    return fn();
  } finally {
    try { fs.unlinkSync(lock); } catch {}
  }
}

function update(file, name, fallback, mutate) {
  return withLock(name, () => {
    const data = readJson(file, fallback());
    const result = mutate(data);
    writeJson(file, data);
    return result;
  });
}

function log(...parts) {
  try {
    ensureHome();
    const file = paths.logFile();
    try {
      if (fs.statSync(file).size > 256 * 1024) fs.renameSync(file, `${file}.old`);
    } catch {}
    const line = parts.map((p) => (p instanceof Error ? p.stack || p.message : String(p))).join(' ');
    fs.appendFileSync(file, `${new Date().toISOString()} ${line}\n`);
  } catch {}
}

module.exports = { readJson, writeJson, withLock, update, log, ensureHome };
