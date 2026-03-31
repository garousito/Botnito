module.exports = {
  name: 'ping',
  aliases: ['alive'],
  description: 'Verifica si el bot está en línea.',
  run: async ({ sock, from }) => {
    await sock.sendMessage(from, { text: '🏓 Pong! Bot activo.' });
  }
};
