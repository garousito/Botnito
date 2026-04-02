const path = require('path');
require('dotenv').config();

const config = {
  botName: process.env.BOT_NAME || 'Botnito',
  ownerName: process.env.OWNER_NAME || 'Owner',
  ownerNumber: process.env.OWNER_NUMBER || '',
  prefix: process.env.PREFIX || '.',
  autoRead: process.env.AUTO_READ === 'true',
  timezone: process.env.TZ || 'America/Mexico_City',
  sessionDir: path.resolve(process.cwd(), 'session'),
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-5-mini',
  openaiImageModel: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
  openaiTtsModel: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
  openaiTtsVoice: process.env.OPENAI_TTS_VOICE || 'alloy',
  openaiTranscriptionModel: process.env.OPENAI_TRANSCRIPTION_MODEL || 'gpt-4o-mini-transcribe'
};

module.exports = config;
