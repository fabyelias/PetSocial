# 🐾 PetSocial - Guía de Configuración Final para Vercel

## ✅ Lo que se ha hecho

He configurado tu proyecto para que funcione correctamente en Vercel. Se han creado los siguientes archivos:

### 1. **vercel.json** - Configuración de Vercel
Define cómo Vercel debe construir tu monorepo:
- Build command: `npm run build`
- Output directory: `apps/web/.next`
- Install command: `npm install`

### 2. **package.json** (raíz)
Archivo package.json en la raíz del proyecto que:
- Define el monorepo con workspaces
- Proporciona scripts de build que Vercel puede ejecutar

### 3. **apps/web/.env.production**
Variables de entorno para producción (ya está en el repo)

### 4. **apps/web/.env.local**
Variables de entorno para desarrollo local (no se sube a git)

## 🔧 Pasos Finales en Vercel Dashboard

### Paso 1: Configura las Variables de Entorno

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Haz clic en **Settings** → **Environment Variables**
3. Agrega estas variables:

```
NEXT_PUBLIC_API_URL = https://tu-api-supabase.com/api/v1
NEXT_PUBLIC_WS_URL = wss://tu-api-supabase.com
NEXT_PUBLIC_APP_URL = https://pet-social-chi.vercel.app
NEXT_PUBLIC_APP_NAME = PetSocial
```

**⚠️ IMPORTANTE**: Reemplaza `https://tu-api-supabase.com` con la URL real de tu API en Supabase.

### Paso 2: Verifica la Configuración de Build

En Vercel Dashboard, ve a **Settings** → **Build & Development Settings**:
- **Build Command**: `npm run build`
- **Output Directory**: `apps/web/.next`
- **Install Command**: `npm install`

### Paso 3: Fuerza un Nuevo Deploy

1. Ve a **Deployments**
2. Haz clic en el último deployment
3. Haz clic en **Redeploy** (esquina superior derecha)

## 📝 Configuración Local

Para desarrollar localmente:

```bash
# 1. Instala dependencias
npm install

# 2. Crea el archivo .env.local en apps/web/
# (Ya está creado, pero verifica que tenga los valores correctos)

# 3. Inicia el servidor de desarrollo
npm run dev

# 4. Abre http://localhost:3001 en tu navegador
```

## 🔍 Troubleshooting

### Si aún no ves la app en Vercel:

1. **Revisa los logs de build**:
   - Ve a Vercel Dashboard → Deployments
   - Haz clic en el deployment más reciente
   - Revisa la sección "Build Logs"

2. **Verifica las variables de entorno**:
   - Asegúrate de que `NEXT_PUBLIC_API_URL` esté configurada
   - Las variables públicas (NEXT_PUBLIC_*) deben estar en Vercel

3. **Comprueba la conexión a la API**:
   - Abre la consola del navegador (F12)
   - Busca errores de CORS o conexión
   - Verifica que tu API esté corriendo y accesible

4. **Limpia el cache**:
   - En Vercel, haz clic en **Redeploy** para forzar un nuevo build

### Si ves errores de módulos no encontrados:

- Asegúrate de que todas las dependencias estén en `apps/web/package.json`
- Ejecuta `npm install` localmente para verificar

## 📚 Estructura del Proyecto

```
PetSocial/
├── apps/
│   ├── api/                    # Backend NestJS (no se deploya en Vercel)
│   │   ├── src/
│   │   ├── package.json
│   │   └── ...
│   └── web/                    # Frontend Next.js (se deploya en Vercel)
│       ├── app/
│       ├── components/
│       ├── lib/
│       ├── stores/
│       ├── package.json
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── .env.local          # Desarrollo local
│       ├── .env.production     # Producción
│       └── ...
├── vercel.json                 # Configuración de Vercel
├── package.json                # Package.json raíz (monorepo)
├── docker-compose.yml
└── ...
```

## 🚀 Próximos Pasos

1. **Configura tu API en Supabase**:
   - Asegúrate de que tu API esté corriendo
   - Obtén la URL de tu API
   - Configura CORS para permitir `https://pet-social-chi.vercel.app`

2. **Actualiza las variables de entorno en Vercel**:
   - Reemplaza `https://tu-api-supabase.com` con tu URL real

3. **Haz un nuevo deploy**:
   - Vercel debería detectar automáticamente los cambios en GitHub
   - Si no, haz clic en "Redeploy" en Vercel Dashboard

4. **Prueba la app**:
   - Ve a https://pet-social-chi.vercel.app
   - Deberías ver la página de inicio de PetSocial

## 💡 Tips

- **Desarrollo local**: Usa `npm run dev` para iniciar el servidor en http://localhost:3001
- **Build local**: Usa `npm run build` para verificar que el build funciona antes de hacer push
- **Logs de Vercel**: Siempre revisa los logs de Vercel si algo no funciona
- **Variables de entorno**: Las variables públicas (NEXT_PUBLIC_*) se inyectan en el build

## ❓ Preguntas Frecuentes

**P: ¿Por qué no se ve la app en Vercel?**
R: Probablemente porque falta configurar las variables de entorno o porque la URL de la API no es correcta.

**P: ¿Cómo sé si el build fue exitoso?**
R: Ve a Vercel Dashboard → Deployments y revisa el estado del deployment. Si es verde, fue exitoso.

**P: ¿Puedo ver los logs de build?**
R: Sí, en Vercel Dashboard → Deployments → [Tu deployment] → Build Logs

**P: ¿Qué pasa si cambio las variables de entorno?**
R: Necesitas hacer un nuevo deploy. Puedes hacer clic en "Redeploy" en Vercel Dashboard.

---

**¡Listo!** Tu app debería estar funcionando en https://pet-social-chi.vercel.app 🎉
