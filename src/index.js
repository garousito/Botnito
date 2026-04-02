const readline = require('readline');
const pino = require('pino');
const chalk = require('chalk');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  downloadMediaMessage
} = require('@whiskeysockets/baileys');

const config = require('./config');
const { loadCommands } = require('./lib/commands');
const { readStore, writeStore } = require('./lib/store');
const { getGame, setMode, setTheme, setArtStyle, appendNarrative } = require('./lib/roleGame');
const { getPlayer, addPlayerExp } = require('./lib/playerRegistry');
const { createIntro, continueStory, generateSceneImage, textToSpeech, transcribeAudio } = require('./lib/ai');

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

async function readAudioBuffer(msg) {
  try {
    if (!msg?.message?.audioMessage) return null;
    return await downloadMediaMessage(msg, 'buffer', {}, { logger: pino({ level: 'silent' }) });
  } catch {
    return null;
  }
}

async function sendNarrationByMode({ sock, from, text, gameMode }) {
  if (gameMode !== 'audio') {
    await sock.sendMessage(from, { text });
    return;
  }

  await sock.sendMessage(from, { text: `🎙️ Narración:\n${text}` });

  try {
    const audio = await textToSpeech(text);
    if (audio) {
      await sock.sendMessage(from, {
        audio,
        mimetype: 'audio/mpeg',
        ptt: true
      });
    }
  } catch (error) {
    await sock.sendMessage(from, {
      text: '⚠️ No pude crear el audio del master en este turno; continúo en texto.'
    });
    console.warn('Error TTS:', error?.message || error);
  }
}

function parseMode(rawText) {
  const normalized = (rawText || '').trim().toLowerCase();
  if (['texto', 'text', 't'].includes(normalized)) return 'texto';
  if (['audio', 'voz', 'voice', 'a'].includes(normalized)) return 'audio';
  return null;
}

async function handleRoleInput({ sock, from, sender, text, audioBuffer }) {
  const game = getGame(from, sender);
  if (!game) return false;

  const player = getPlayer(sender);
  const playerName = player?.name || 'Aventurero';

  if (game.status === 'awaiting_mode') {
    const mode = parseMode(text);
    if (!mode) {
      await sock.sendMessage(from, {
        text: 'Modo no válido. Escribe *texto* o *audio*.'
      });
      return true;
    }

    setMode(from, sender, mode);
    await sock.sendMessage(from, {
      text: '🧙 *Paso 2/3*\nDame un tema para la historia (fantasía, pesca, terror, supervivencia, cyberpunk, etc.).'
    });
    return true;
  }

  if (game.status === 'awaiting_theme') {
    const theme = text.trim();
    if (!theme) {
      await sock.sendMessage(from, { text: 'Necesito un tema para iniciar tu aventura.' });
      return true;
    }

    setTheme(from, sender, theme);
    await sock.sendMessage(from, {
      text:
        '🎨 *Paso 3/3*\nAhora dime el estilo de arte para las imágenes.\n\n' +
        'Escríbelo como: *estilo + iluminación + encuadre + nivel de detalle*.\n' +
        'Ejemplo: "fantasía oscura, luz de luna, plano general cinematográfico, ultra detallado".'
    });
    return true;
  }

  if (game.status === 'awaiting_style') {
    const artStyle = text.trim();
    if (!artStyle) {
      await sock.sendMessage(from, { text: 'Necesito un estilo de arte para crear la portada de tu aventura.' });
      return true;
    }

    setArtStyle(from, sender, artStyle);
    const updated = getGame(from, sender);

    const intro = await createIntro({
      theme: updated.theme,
      artStyle,
      mode: updated.mode,
      playerName
    });

    appendNarrative(from, sender, `Tema: ${updated.theme} | Estilo: ${artStyle}`, intro);
    await sendNarrationByMode({ sock, from, text: `🎲 *Partida iniciada*\n\n${intro}`, gameMode: updated.mode });

    try {
      const scene = await generateSceneImage({
        theme: updated.theme,
        artStyle,
        sceneDescription: intro
      });

      if (scene?.buffer) {
        await sock.sendMessage(from, {
          image: scene.buffer,
          mimetype: scene.mimeType,
          caption: '🖼️ Ilustración inicial de tu aventura.'
        });
      }
    } catch (imageError) {
      console.warn('No se pudo generar imagen inicial:', imageError?.message || imageError);
      await sock.sendMessage(from, {
        text: '⚠️ No pude generar la imagen inicial, pero tu historia ya comenzó.'
      });
    }

    return true;
  }

  if (game.status === 'active') {
    let decision = text;

    if (game.mode === 'audio' && !decision && audioBuffer) {
      decision = await transcribeAudio(audioBuffer);
      if (!decision) {
        await sock.sendMessage(from, {
          text: 'No pude entender el audio. ¿Puedes repetirlo o escribir tu decisión?'
        });
        return true;
      }

      await sock.sendMessage(from, { text: `📝 Transcripción detectada: "${decision}"` });
    }

    if (!decision) return true;

    const next = await continueStory({
      theme: game.theme,
      artStyle: game.artStyle,
      mode: game.mode,
      playerName,
      history: game.history,
      decision
    });

    appendNarrative(from, sender, decision, next);
    addPlayerExp(sender, 2);
    await sendNarrationByMode({ sock, from, text: next, gameMode: game.mode });
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
    const audioBuffer = await readAudioBuffer(msg);

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

      await handleRoleInput({ sock, from, sender, text, audioBuffer });
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
