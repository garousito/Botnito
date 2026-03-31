const readline = require('readline');
const pino = require('pino');
const chalk = require('chalk');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');

const config = require('./config');
const { loadCommands } = require('./lib/commands');
const { readStore, writeStore } = require('./lib/store');
const { getGame, setTheme, appendNarrative } = require('./lib/roleGame');
const { getPlayer, addPlayerExp } = require('./lib/playerRegistry');
const { createIntro, continueStory } = require('./lib/ai');

const commandRegistry = loadCommands();

function parseMessageContent(message) {
  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message.imageMessage?.caption) return message.imageMessage.caption;
  if (message.videoMessage?.caption) return message.videoMessage.caption;
  return '';
}

function normalizeJid(jid = '') {
  return jid.split(':')[0] || jid;
}

function parseCommand(text) {
  if (!text) return null;

  const isSlash = text.startsWith('/');
  const isPrefix = text.startsWith(config.prefix);
  if (!isSlash && !isPrefix) return null;

  const raw = isSlash ? text.slice(1) : text.slice(config.prefix.length);
  const [cmdName, ...args] = raw.trim().split(/\s+/);
  if (!cmdName) return null;

  return {
    cmdName: cmdName.toLowerCase(),
    args
  };
}

async function handleRoleInput({ sock, from, sender, text }) {
  const game = getGame(from, sender);
  if (!game) return false;

  const player = getPlayer(sender);
  const playerName = player?.name || 'Aventurero';

  if (game.status === 'awaiting_theme') {
    const theme = text.trim();
    if (!theme) {
      await sock.sendMessage(from, { text: 'Necesito un tema para iniciar tu aventura.' });
      return true;
    }

    setTheme(from, sender, theme);
    const intro = await createIntro({ theme, playerName });
    appendNarrative(from, sender, `Tema elegido: ${theme}`, intro);
    await sock.sendMessage(from, { text: `🎲 *Partida iniciada*\n\n${intro}` });
    return true;
  }

  if (game.status === 'active') {
    const next = await continueStory({
      theme: game.theme,
      playerName,
      history: game.history,
      decision: text
    });

    appendNarrative(from, sender, text, next);
    addPlayerExp(sender, 2);
    await sock.sendMessage(from, { text: next });
    return true;
  }

  return false;
}

async function startBot() {
  console.clear();
  console.log(chalk.green(`🚀 Iniciando ${config.botName}`));

  const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }))
    },
    browser: ['Botnito', 'Chrome', '1.0.0']
  });

  if (!sock.authState.creds.registered) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const number = await new Promise((resolve) => {
      rl.question('📲 Ingresa tu número con código de país (solo números): ', resolve);
    });
    rl.close();

    const clean = (number || '').replace(/\D/g, '');
    if (!clean) throw new Error('Número inválido para pairing code.');

    const code = await sock.requestPairingCode(clean);
    console.log(chalk.yellow(`🔐 Código de vinculación: ${code}`));
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      console.log(chalk.green('✅ Conexión establecida correctamente.'));
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode === DisconnectReason.loggedOut) {
        console.log(chalk.red('❌ Sesión cerrada. Borra /session y vuelve a vincular.'));
        return;
      }

      console.log(chalk.yellow('⚠️ Conexión cerrada. Reintentando...'));
      startBot();
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' || !messages?.length) return;

    const msg = messages[0];
    if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;

    const from = msg.key.remoteJid;
    const sender = normalizeJid(msg.key.participant || from);
    const text = parseMessageContent(msg.message).trim();
    if (!text) return;

    const db = readStore();
    db.users[sender] = db.users[sender] || { exp: 0, coins: 0, createdAt: new Date().toISOString() };
    db.users[sender].exp += 1;
    writeStore(db);

    try {
      if (config.autoRead) {
        await sock.readMessages([msg.key]);
      }

      const parsed = parseCommand(text);
      if (parsed) {
        const command = commandRegistry.get(parsed.cmdName);
        if (!command) return;

        await command.run({
          sock,
          msg,
          from,
          sender,
          args: parsed.args,
          config,
          prefix: config.prefix,
          commandRegistry
        });

        return;
      }

      await handleRoleInput({ sock, from, sender, text });
    } catch (error) {
      console.error('Error en comando:', error);
      await sock.sendMessage(from, { text: '⚠️ Ocurrió un error ejecutando el comando.' });
    }
  });
}

startBot().catch((error) => {
  console.error('Error fatal al iniciar el bot:', error);
  process.exit(1);
});
