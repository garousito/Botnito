const { endGame } = require('../lib/roleGame');

module.exports = {
  name: 'salir',
  aliases: ['exit'],
  description: 'Termina la partida actual.',
  run: async ({ sock, from, sender }) => {
    const ended = endGame(from, sender);
    await sock.sendMessage(from, {
      text: ended
        ? '🛑 Partida finalizada. Cuando quieras volver, escribe /rol.'
        : 'No tenías una partida activa.'
    });
  }
};
