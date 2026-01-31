# PetSocial - Configuración de Vercel

## Problema Identificado

La app no se mostraba en Vercel porque faltaba la configuración correcta para el monorepo.

## Solución Implementada

Se han creado los siguientes archivos:

1. **`vercel.json`** - Configuración de Vercel para el monorepo
2. **`package.json`** (raíz) - Package.json raíz con scripts de build
3. **`apps/web/.env.production`** - Variables de entorno para producción
4. **`apps/web/.env.local`** - Variables de entorno para desarrollo local

## Pasos para Configurar en Vercel

### 1. Configurar Variables de Entorno en Vercel Dashboard

Ve a tu proyecto en Vercel y configura las siguientes variables de entorno:

```
NEXT_PUBLIC_API_URL = https://tu-api-domain.com/api/v1
NEXT_PUBLIC_WS_URL = wss://tu-api-domain.com
NEXT_PUBLIC_APP_URL = https://pet-social-chi.vercel.app
NEXT_PUBLIC_APP_NAME = PetSocial
```

### 2. Configurar el Build Command

En Vercel Dashboard:
- **Build Command**: `npm run build`
- **Output Directory**: `apps/web/.next`
- **Install Command**: `npm install`

### 3. Hacer Push a GitHub

```bash
git add .
git commit -m "Configure Vercel for monorepo deployment"
git push origin main
```

Vercel debería detectar automáticamente los cambios y hacer un nuevo deploy.

## Estructura del Proyecto

```
PetSocial/
├── apps/
│   ├── api/          # Backend NestJS
│   └── web/          # Frontend Next.js
├── vercel.json       # Configuración de Vercel
├── package.json      # Package.json raíz
└── docker-compose.yml
```

## Variables de Entorno Necesarias

### Para Desarrollo Local

En `apps/web/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=PetSocial
```

### Para Producción (Vercel)

En Vercel Dashboard, configura:
```
NEXT_PUBLIC_API_URL=https://tu-api-domain.com/api/v1
NEXT_PUBLIC_WS_URL=wss://tu-api-domain.com
NEXT_PUBLIC_APP_URL=https://pet-social-chi.vercel.app
NEXT_PUBLIC_APP_NAME=PetSocial
```

## Próximos Pasos

1. **Actualiza la URL de tu API**: Reemplaza `https://tu-api-domain.com` con la URL real de tu API en Supabase
2. **Configura CORS**: Asegúrate de que tu API permita requests desde `https://pet-social-chi.vercel.app`
3. **Verifica el Deploy**: Una vez hecho push, Vercel debería hacer un nuevo deploy automáticamente

## Troubleshooting

Si aún no ves la app:

1. **Revisa los logs de Vercel**: Ve a Vercel Dashboard → Deployments → Logs
2. **Verifica las variables de entorno**: Asegúrate de que `NEXT_PUBLIC_API_URL` esté configurada correctamente
3. **Comprueba la conexión a la API**: Abre la consola del navegador (F12) y verifica si hay errores de conexión
4. **Limpia el cache**: En Vercel Dashboard, haz clic en "Redeploy" para forzar un nuevo build

## Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Build local
npm run build

# Start local
npm start

# Lint
npm run lint
```
