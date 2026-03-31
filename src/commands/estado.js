const { getGame } = require('../lib/roleGame');

module.exports = {
  name: 'estado',
  aliases: ['status'],
  description: 'Muestra el estado de tu partida de rol.',
  run: async ({ sock, from, sender }) => {
    const game = getGame(from, sender);
    if (!game) {
      await sock.sendMessage(from, { text: 'No tienes partida activa. Usa /rol para comenzar.' });
      return;
    }

    const lastDecision = game.decisions[game.decisions.length - 1] || 'Aún sin decisiones';
    await sock.sendMessage(from, {
      text:
        `📜 *Estado de partida*\n` +
        `Tema: ${game.theme || 'Pendiente'}\n` +
        `Progreso: ${game.progress}\n` +
        `Turno: ${game.turn}\n` +
        `Última decisión: ${lastDecision}\n` +
        `Inventario: ${game.inventory.join(', ') || 'Vacío'}`
    });
  }
};
