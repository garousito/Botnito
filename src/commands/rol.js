const { getPlayer } = require('../lib/playerRegistry');
const { startGame, getGame } = require('../lib/roleGame');

module.exports = {
  name: 'rol',
  aliases: ['rpg'],
  description: 'Inicia una partida narrativa con IA.',
  run: async ({ sock, from, sender }) => {
    const player = getPlayer(sender);
    if (!player) {
      await sock.sendMessage(from, {
        text: 'Primero debes registrarte con /registro Nombre|Edad'
      });
      return;
    }

    const active = getGame(from, sender);
    if (active?.status === 'active' || active?.status === 'awaiting_theme') {
      await sock.sendMessage(from, {
        text: '🎮 Ya tienes una partida en curso. Usa /estado para verla o /salir para terminarla.'
      });
      return;
    }

    startGame(from, sender);
    await sock.sendMessage(from, {
      text: '🧙 Dame un tema para la historia (fantasía, pesca, terror, supervivencia, etc.)'
    });
  }
};
