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
  openaiModel: process.env.OPENAI_MODEL || 'gpt-5-mini'
};

module.exports = config;
