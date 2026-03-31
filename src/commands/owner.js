module.exports = {
  name: 'owner',
  aliases: ['creador'],
  description: 'Muestra la información del creador del bot.',
  run: async ({ sock, from, config }) => {
    const owner = config.ownerNumber || 'No configurado';
    await sock.sendMessage(from, {
      text: `👑 *Owner:* ${config.ownerName}\n📱 *Número:* ${owner}`
    });
  }
};
