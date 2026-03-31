# Botnito WhatsApp Base (Termux + MT Manager)

Base propia de bot WhatsApp creada en Node.js + Baileys, ahora expandida como **BOT DE JUEGO DE ROL con IA (ChatGPT API)**.

## Qué incluye ahora

- Flujo de partida RPG tipo Dungeon Master.
- IA narrativa con API de OpenAI.
- Estado por jugador y por chat (sin mezclar historias en grupos).
- Registro de jugadores estilo Naufrabot (`/registro`).
- Persistencia en `data.json`:
  - registro de usuarios,
  - partidas activas,
  - historial de decisiones,
  - progreso e inventario básico.

## Comandos principales

- `/registro Nombre|Edad` → registra jugador.
- `/rol` → inicia partida y pide tema.
- `/estado` → muestra estado de partida actual.
- `/salir` → termina partida.
- `/help` → menú de comandos.

## Flujo RPG

1. Usuario ejecuta `/rol`.
2. Bot pide tema narrativo.
3. Usuario responde tema (fantasía, pesca, terror, etc.).
4. Bot genera introducción con IA.
5. Cada respuesta del jugador continúa la historia vía API.
6. El bot adapta narrativa con consecuencias + siguiente dilema.

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
```

> Si `OPENAI_API_KEY` no está configurada, el bot responde con un fallback narrativo local para pruebas.

## Estructura

```txt
src/
  commands/
    estado.js
    registro.js
    rol.js
    salir.js
    help.js
    ping.js
    owner.js
  lib/
    ai.js
    commands.js
    playerRegistry.js
    roleGame.js
    store.js
  config.js
  index.js
scripts/
  start.sh
session/
.env.example
data.json (se crea solo)
```

## Instalación en Termux

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

## Uso con MT Manager

- Edita comandos en `src/commands/`.
- Ajusta IA en `src/lib/ai.js`.
- Ajusta estado de juego en `src/lib/roleGame.js`.
- Reinicia con `npm start` o `bash scripts/start.sh`.
