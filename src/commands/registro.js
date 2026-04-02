const { getPlayer, registerPlayer } = require('../lib/playerRegistry');

module.exports = {
  name: 'registro',
  aliases: ['reg', 'register'],
  description: 'Registra un jugador. Uso: /registro Nombre|Edad',
  run: async ({ sock, from, sender, args }) => {
    const exists = getPlayer(sender);
    if (exists) {
      await sock.sendMessage(from, {
        text: `✅ Ya estás registrado como *${exists.name}* (ID: ${exists.serial}).`
      });
      return;
    }

    const payload = args.join(' ').split('|');
    const name = (payload[0] || '').trim();
    const age = Number((payload[1] || '').trim());

    if (!name || !age) {
      await sock.sendMessage(from, {
        text: '❗ Usa: /registro Nombre|Edad\nEjemplo: /registro Naufra|21'
      });
      return;
    }

    const player = registerPlayer({ sender, name, age });
    await sock.sendMessage(from, {
      text: `🪪 *Registro completado*\nNombre: ${player.name}\nEdad: ${player.age}\nID: ${player.serial}`
    });
  }
};
