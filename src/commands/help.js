module.exports = {
  name: 'help',
  aliases: ['menu'],
  description: 'Muestra el menú de comandos disponibles.',
  run: async ({ sock, from, commandRegistry, prefix }) => {
    const uniqueCommands = [...new Set(commandRegistry.values())];
    const lines = uniqueCommands.map((cmd) => `• ${prefix}${cmd.name} — ${cmd.description || 'Sin descripción'}`);

    await sock.sendMessage(from, {
      text: `📚 *Menú principal*\n\n${lines.join('\n')}`
    });
  }
};
