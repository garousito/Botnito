const OpenAI = require('openai');
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

async function createIntro({ theme, playerName }) {
  const prompt = `Inicia una aventura de rol para ${playerName}. Tema: ${theme}. Presenta una introducción + primera situación.`;
  const fallback = `🌌 *Aventura: ${theme}*\n${playerName}, una sombra recorre el horizonte y todo cambia en segundos. Frente a ti hay dos rutas: un sendero iluminado y una cueva profunda.\n\n¿Qué haces?`;
  return runAI(prompt, fallback);
}

async function continueStory({ theme, playerName, history, decision }) {
  const memory = history.slice(-8).map((item) => `${item.role}: ${item.content}`).join('\n');
  const prompt = `Continúa la historia de ${playerName}.\nTema: ${theme}\nHistorial:\n${memory}\n\nNueva decisión del jugador: ${decision}\n\nContinúa con consecuencias y siguiente dilema.`;
  const fallback = `⚔️ Decides: ${decision}. El entorno responde con un giro inesperado y escuchas un ruido detrás de ti.\n\n¿Investigas el sonido o avanzas sin mirar atrás?`;
  return runAI(prompt, fallback);
}

module.exports = {
  createIntro,
  continueStory
};
