#!/data/data/com.termux/files/usr/bin/bash

while true; do
  clear
  echo "[Botnito] Ejecutando en modo reinicio automático..."
  node src/index.js
  echo "[Botnito] Reiniciando en 2s..."
  sleep 2
done
