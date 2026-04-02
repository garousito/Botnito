const crypto = require('crypto');
const { readStore, writeStore } = require('./store');

function getRegistryKey(sender) {
  return sender;
}

function getPlayer(sender) {
  const db = readStore();
  return db.registry[getRegistryKey(sender)] || null;
}

function registerPlayer({ sender, name, age }) {
  const db = readStore();
  const key = getRegistryKey(sender);

  const serial = crypto
    .createHash('md5')
    .update(`${sender}-${Date.now()}`)
    .digest('hex')
    .slice(0, 10)
    .toUpperCase();

  db.registry[key] = {
    id: sender,
    serial,
    name,
    age,
    level: 1,
    exp: 0,
    registeredAt: new Date().toISOString()
  };

  writeStore(db);
  return db.registry[key];
}

function addPlayerExp(sender, amount = 1) {
  const db = readStore();
  const key = getRegistryKey(sender);
  if (!db.registry[key]) return null;

  db.registry[key].exp += amount;
  if (db.registry[key].exp >= db.registry[key].level * 20) {
    db.registry[key].exp = 0;
    db.registry[key].level += 1;
  }

  writeStore(db);
  return db.registry[key];
}

module.exports = {
  getPlayer,
  registerPlayer,
  addPlayerExp
};
