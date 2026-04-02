# Botnito WhatsApp Base (Termux + MT Manager)

Base de bot WhatsApp con Node.js + Baileys, enfocada en RPG con IA y soporte dual:

- **Modo texto** (narrativa y respuestas escritas)
- **Modo audio** (master envía notas de voz y jugadores responden por audio o texto)

## Qué incluye

- Flujo RPG tipo Dungeon Master con OpenAI.
- Selección de modo antes de iniciar la partida.
- Generación de imagen inicial de la aventura.
- Transcripción de audio de jugador (STT) en modo audio.
- Narración por voz del master (TTS) en modo audio.
- Estado por jugador y por chat (sin mezclar historias en grupos).
- Registro de jugadores estilo Naufrabot (`/registro`).

## Comandos

- `/registro Nombre|Edad` → registra jugador.
- `/rol` → inicia partida (elige modo, tema y estilo de arte).
- `/estado` → muestra estado actual.
- `/salir` → termina partida.
- `/dado 20` → tirada opcional.

## Flujo completo

1. `/rol`
2. Elegir modo: `texto` o `audio`
3. Escribir tema
4. Escribir estilo artístico
5. Bot genera intro + imagen
6. Durante partida:
   - modo texto: escribe decisiones
   - modo audio: envía audio o texto (el bot transcribe audio)

## Cómo escribir estilo artístico correctamente

Plantilla:

`estilo + iluminación + encuadre + nivel de detalle`

Ejemplos:
- `fantasía oscura, luz de luna, plano general cinematográfico, ultra detallado`
- `anime medieval, atardecer cálido, plano medio, colores vibrantes`
- `realismo mágico, niebla suave, vista panorámica, alto detalle`

## Variables de entorno

```env
BOT_NAME=Botnito
OWNER_NAME=TuNombre
OWNER_NUMBER=5210000000000
PREFIX=.
AUTO_READ=false
TZ=America/Mexico_City
OPENAI_API_KEY=sk-xxxx
OPENAI_MODEL=gpt-5-mini
OPENAI_IMAGE_MODEL=gpt-image-1
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=alloy
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
```

## Instalación rápida (Termux)

```bash
pkg update -y && pkg upgrade -y
pkg install git nodejs-lts -y
git clone <TU_REPO>
cd Botnito
npm install
cp .env.example .env
nano .env
npm start
```
