const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'data.json');

const defaultDB = {
  users: {},
  groups: {},
  registry: {},
  roleGames: {}
};

function ensureStore() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultDB, null, 2));
    return;
  }

  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const merged = {
    ...defaultDB,
    ...data,
    users: data.users || {},
    groups: data.groups || {},
    registry: data.registry || {},
    roleGames: data.roleGames || {}
  };

  fs.writeFileSync(dbPath, JSON.stringify(merged, null, 2));
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function writeStore(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
  readStore,
  writeStore
};
