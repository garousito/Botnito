const { readStore, writeStore } = require('./store');

function createSessionKey(chatId, sender) {
  return `${chatId}::${sender}`;
}

function getGame(chatId, sender) {
  const db = readStore();
  return db.roleGames[createSessionKey(chatId, sender)] || null;
}

function saveGame(game) {
  const db = readStore();
  db.roleGames[createSessionKey(game.chatId, game.playerId)] = game;
  writeStore(db);
  return game;
}

function startGame(chatId, sender) {
  const game = {
    chatId,
    playerId: sender,
    theme: null,
    status: 'awaiting_theme',
    history: [],
    progress: 'Inicio de aventura',
    decisions: [],
    inventory: [],
    turn: 0,
    updatedAt: new Date().toISOString()
  };

  return saveGame(game);
}

function setTheme(chatId, sender, theme) {
  const game = getGame(chatId, sender);
  if (!game) return null;

  game.theme = theme;
  game.status = 'active';
  game.progress = `Mundo: ${theme}`;
  game.updatedAt = new Date().toISOString();

  return saveGame(game);
}

function appendNarrative(chatId, sender, playerChoice, narratorText) {
  const game = getGame(chatId, sender);
  if (!game) return null;

  if (playerChoice) {
    game.decisions.push(playerChoice);
    game.history.push({ role: 'user', content: playerChoice });
  }

  game.history.push({ role: 'assistant', content: narratorText });
  game.turn += 1;
  game.progress = `Turno ${game.turn} completado`;
  game.updatedAt = new Date().toISOString();

  return saveGame(game);
}

function endGame(chatId, sender) {
  const db = readStore();
  const key = createSessionKey(chatId, sender);
  if (!db.roleGames[key]) return false;
  delete db.roleGames[key];
  writeStore(db);
  return true;
}

module.exports = {
  startGame,
  getGame,
  setTheme,
  appendNarrative,
  endGame
};
