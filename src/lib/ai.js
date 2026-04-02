const OpenAI = require('openai');
const { toFile } = require('openai');
const config = require('../config');

const SYSTEM_PROMPT =
  'Eres un maestro de rol experto. Narras historias inmersivas, dinámicas y adaptativas. Presentas situaciones, desafíos y consecuencias basadas en las decisiones del jugador. Mantienes coherencia narrativa, generas tensión, y permites libertad creativa. Responde en español, en máximo 120 palabras por turno y termina con una pregunta u opciones claras.';

const client = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;

async function runAI(input, fallback) {
  if (!client) return fallback;

  const response = await client.responses.create({
    model: config.openaiModel,
    instructions: SYSTEM_PROMPT,
    input
  });

  return response.output_text || fallback;
}

async function createIntro({ theme, artStyle, mode, playerName }) {
  const prompt = `Inicia una aventura de rol para ${playerName}. Tema: ${theme}. Estilo visual de referencia: ${artStyle}. Modo: ${mode}. Presenta una introducción + primera situación.`;
  const fallback = `🌌 *Aventura: ${theme}*\nEstilo visual: ${artStyle}.\nModo: ${mode}.\n${playerName}, una sombra recorre el horizonte y todo cambia en segundos. Frente a ti hay dos rutas: un sendero iluminado y una cueva profunda.\n\n¿Qué haces?`;
  return runAI(prompt, fallback);
}

async function continueStory({ theme, artStyle, mode, playerName, history, decision }) {
  const memory = history.slice(-8).map((item) => `${item.role}: ${item.content}`).join('\n');
  const prompt = `Continúa la historia de ${playerName}.\nTema: ${theme}\nEstilo visual de referencia: ${artStyle}\nModo: ${mode}\nHistorial:\n${memory}\n\nNueva decisión del jugador: ${decision}\n\nContinúa con consecuencias y siguiente dilema.`;
  const fallback = `⚔️ Decides: ${decision}. El entorno responde con un giro inesperado y escuchas un ruido detrás de ti.\n\n¿Investigas el sonido o avanzas sin mirar atrás?`;
  return runAI(prompt, fallback);
}

async function generateSceneImage({ theme, artStyle, sceneDescription }) {
  if (!client) return null;

  const prompt = `Ilustración narrativa para juego de rol. Tema: ${theme}. Estilo artístico: ${artStyle}. Escena: ${sceneDescription}. Sin texto, cinematográfico, detallado, apto para todo público.`;

  const image = await client.images.generate({
    model: config.openaiImageModel,
    prompt,
    size: '1024x1024'
  });

  const b64 = image?.data?.[0]?.b64_json;
  if (!b64) return null;

  return {
    buffer: Buffer.from(b64, 'base64'),
    mimeType: 'image/png',
    prompt
  };
}

async function textToSpeech(input) {
  if (!client) return null;

  const speech = await client.audio.speech.create({
    model: config.openaiTtsModel,
    voice: config.openaiTtsVoice,
    input,
    format: 'mp3'
  });

  const audioBuffer = Buffer.from(await speech.arrayBuffer());
  return audioBuffer;
}

async function transcribeAudio(audioBuffer) {
  if (!client) return null;

  const file = await toFile(audioBuffer, 'player_audio.ogg');
  const transcription = await client.audio.transcriptions.create({
    file,
    model: config.openaiTranscriptionModel,
    language: 'es'
  });

  return transcription?.text || null;
}

module.exports = {
  createIntro,
  continueStory,
  generateSceneImage,
  textToSpeech,
  transcribeAudio
};
