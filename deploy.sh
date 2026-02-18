#!/bin/bash
# =============================================================
# Script de deploy para PetSocial en Hostinger VPS
# Servidor: 82.25.74.83
# Uso: bash deploy.sh
# =============================================================

set -e  # Salir si cualquier comando falla

APP_DIR="/var/www/petsocial"
REPO_URL="https://github.com/TU_USUARIO/TU_REPO.git"   # <-- CAMBIAR
BRANCH="main"

echo "===> Actualizando código..."
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
  git pull origin "$BRANCH"
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "===> Instalando dependencias del frontend..."
cd "$APP_DIR/apps/web"
npm ci --omit=dev

echo "===> Construyendo Next.js..."
npm run build

echo "===> Reiniciando aplicación con PM2..."
cd "$APP_DIR"
pm2 reload ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production

echo "===> Guardando configuración de PM2..."
pm2 save

echo "===> Deploy completado. App corriendo en http://82.25.74.83"
