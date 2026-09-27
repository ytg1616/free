'use strict';
const os = require('os');
const path = require('path');

// Windows: %APPDATA%\soundtrack-dex, others: ~/.config/soundtrack-dex
// commands/*.md use the same rule via "${APPDATA:-$HOME/.config}/soundtrack-dex".
function dexHome() {
  if (process.env.DEX_HOME) return process.env.DEX_HOME;
  if (process.platform === 'win32' && process.env.APPDATA) {
    return path.join(process.env.APPDATA, 'soundtrack-dex');
  }
  return path.join(os.homedir(), '.config', 'soundtrack-dex');
}

function file(name) {
  return path.join(dexHome(), name);
}

module.exports = {
  dexHome,
  configFile: () => file('config.json'),
  dbFile: () => file('db.json'),
  stateFile: () => file('state.json'),
  nowPlayingFile: () => file('nowplaying.json'),
  logFile: () => file('dex.log'),
  lockFile: (name) => file(`${name}.lock`),
  launcherFile: () => file('dex.js'),
  claudeSettingsFile: () =>
    process.env.DEX_CLAUDE_SETTINGS || path.join(os.homedir(), '.claude', 'settings.json'),
};
