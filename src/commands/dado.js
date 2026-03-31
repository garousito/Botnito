module.exports = {
  name: 'dado',
  aliases: ['roll'],
  description: 'Tira un dado. Uso: /dado 20',
  run: async ({ sock, from, args }) => {
    const faces = Math.max(2, Math.min(Number(args[0]) || 6, 100));
    const result = Math.floor(Math.random() * faces) + 1;
    await sock.sendMessage(from, {
      text: `🎲 Tirada d${faces}: *${result}*`
    });
  }
};
