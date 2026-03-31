const fs = require('fs');
const path = require('path');

function loadCommands() {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.js'));

  const registry = new Map();

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (!command?.name || typeof command.run !== 'function') continue;

    registry.set(command.name, command);
    for (const alias of command.aliases || []) {
      registry.set(alias, command);
    }
  }

  return registry;
}

module.exports = { loadCommands };
