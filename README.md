# Soundhub

![Soundhub Banner](https://placehold.co/1200x300/121212/00ffbf?text=SoundHub&font=roboto)

**Soundhub** es una aplicación web de streaming de música full-stack construida con **Angular 20** y **Node.js (Express)**. Utiliza la **API de pública de iTunes** para recuperar metadatos de música (canciones, álbumes, artistas) y está desplegada en **Vercel** como una aplicación serverless.

## Tabla de Contenidos

- [Características](#características)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Prerrequisitos](#prerrequisitos)
- [Comenzando](#comenzando)
- [Variables de Entorno](#variables-de-entorno)
- [Despliegue](#despliegue)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Scripts](#scripts)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

## Características

- :fire: Explorar canciones y álbumes en tendencia (Feed RSS de Apple — región España).
- :mag: Buscar canciones, álbumes y artistas a través de la iTunes Search API.
- :musical_note: Reproducir vistas previas de 30 segundos de canciones con un reproductor de audio global persistente.
- :cd: Ver páginas detalladas de canciones y álbumes con carátulas y metadatos.
- :lock: Autenticación de usuario (registro / inicio de sesión) con sesiones basadas en JWT.
- :pencil2: Crear, editar y gestionar listas de reproducción personales con actualizaciones optimistas de la interfaz y caché en localStorage.
- :bust_in_silhouette: Perfil de usuario con avatar personalizable (subida binaria a Vercel Blob Storage).
- :microphone: Obtención de letras de canciones desde [lrclib.net](https://lrclib.net) (lado del cliente).
- :iphone: SPA totalmente responsive con Angular Material e iconos de Iconify.

## Paleta de Colores

El diseño sigue una estética minimalista "Dark Mode" con acentos en verde neón.

| Color | Hex | Uso |
|---|---|---|
| ![#0f0f10](https://placehold.co/15x15/0f0f10/0f0f10.png) Fondo | `#0f0f10` | Fondo principal de la aplicación |
| ![#121212](https://placehold.co/15x15/121212/121212.png) Superficie | `#121212` | Barras de navegación, laterales |
| ![#181818](https://placehold.co/15x15/181818/181818.png) Tarjetas | `#181818` | Contenedores de elementos |
| ![#00ffbf](https://placehold.co/15x15/00ffbf/00ffbf.png) Acento | `#00ffbf` | Botones principales, estados activos, destacados |
| ![#e6e6e6](https://placehold.co/15x15/e6e6e6/e6e6e6.png) Texto | `#e6e6e6` | Texto principal |

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Angular 20 (componentes standalone, signals, detección de cambios zoneless) |
| Backend | Express 5 (CommonJS, desplegado como Vercel Serverless Function) |
| Base de Datos | PostgreSQL — [Neon](https://neon.tech) (serverless, proporcionado vía integración de Vercel) |
| Almacenamiento Blob | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) (avatares de perfil) |
| Datos de Música | [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/) / Feed RSS de Apple |
| Auth | JSON Web Tokens (JWT) con hashing de contraseñas bcryptjs |
| Estilos | CSS custom, Angular Material |
| Iconos | Componentes web de [Iconify](https://iconify.design/) |
| Testing | Karma + Jasmine |
| Despliegue | [Vercel](https://vercel.com) |

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                        Vercel                           │
│                                                         │
│  ┌──────────────────┐      ┌──────────────────────────┐ │
│  │  Angular 20 SPA  │ ───► │  Express API (Serverless)│ │
│  │  (Static Assets) │      │  /api/*                  │ │
│  └──────────────────┘      └──────────┬───────────────┘ │
│                                       │                 │
│                            ┌──────────┴───────────┐     │
│                            │                      │     │
│                     ┌──────▼──────┐  ┌────────────▼──┐  │
│                     │ Neon        │  │ Vercel Blob   │  │
│                     │ PostgreSQL  │  │ (Avatars)     │  │
│                     └─────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │  iTunes / Apple   │
                  │  Public APIs      │
                  └───────────────────┘
```

- **Frontend** — SPA de Angular 20 con componentes standalone, reactividad basada en signals y `provideZonelessChangeDetection()`. Todas las rutas se renderizan solo en el cliente.
- **Backend** — API REST de Express.js desplegada como una única Vercel Serverless Function. Rutas: `auth`, `music`, `playlists`, `users`, `avatar`.
- **Base de Datos** — Neon PostgreSQL (serverless) para cuentas de usuario, listas de reproducción y canciones de listas de reproducción. Las consultas utilizan `@neondatabase/serverless` con plantillas literales etiquetadas.
- **Almacenamiento Blob** — Vercel Blob para almacenar y servir imágenes de perfil de usuario.
- **APIs Externas** — iTunes Search/Lookup API para metadatos de música; Feed RSS de Apple para contenido en tendencia; lrclib.net para letras.

## Prerrequisitos

Asegúrate de tener lo siguiente instalado en tu máquina:

- **Node.js** >= 18.x — [Descargar](https://nodejs.org/)
- **npm** >= 9.x (se incluye con Node.js)
- **Angular CLI** >= 20.x

```bash
npm install -g @angular/cli
```

- **Vercel CLI** (requerido para desarrollo local con funciones serverless y variables de entorno)

```bash
npm install -g vercel
```

## Comenzando

### 1. Clonar el repositorio

```bash
git clone https://github.com/<tu-usuario>/soundhub.git
cd soundhub
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto (ver [Variables de Entorno](#variables-de-entorno) más abajo).

### 4. Vincular el proyecto a Vercel

Si deseas obtener las variables de entorno de Vercel y ejecutar el backend serverless localmente:

```bash
vercel link
```

Sigue las instrucciones para conectar tu proyecto de Vercel.

### 5. Ejecutar en desarrollo

**Opción A — Full-stack con Vercel (recomendado):**

```bash
vercel dev
```

Esto inicia tanto el servidor de desarrollo de Angular como la API de Express como una función serverless, reflejando el entorno de producción.

**Opción B — Solo Frontend:**

```bash
ng serve
```

La aplicación Angular estará disponible en `http://localhost:4200/`.

**Opción C — Solo Backend:**

```bash
node api/index.js
```

Requiere un archivo `.env.local` con las variables requeridas.

## Variables de Entorno

El backend requiere las siguientes variables de entorno. Al usar `vercel link`, estas pueden administrarse en el panel de control de Vercel y obtenerse localmente con `vercel env pull`.

| Variable | Descripción |
|---|---|
| `SHDB_DATABASE_URL` | Cadena de conexión de Neon PostgreSQL |
| `JWT_SECRET` | Clave secreta para firmar/verificar tokens JWT |
| `BLOB_READ_WRITE_TOKEN` | Token de lectura/escritura de Vercel Blob Storage |

Crea un archivo `.env.local` para el desarrollo local:

```env
SHDB_DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=tu-clave-secreta
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

> **Nota:** Nunca subas `.env.local` al control de versiones.

## Despliegue

Soundhub está diseñado para ser desplegado en **Vercel**. El flujo de trabajo recomendado:

1. **Crear un proyecto en Vercel** — Importa tu repositorio de GitHub desde el [Panel de Vercel](https://vercel.com/new).
2. **Vincular localmente** — Ejecuta `vercel link` en la raíz de tu proyecto para conectar tu entorno local al proyecto de Vercel.
3. **Establecer variables de entorno** — Configura `SHDB_DATABASE_URL`, `JWT_SECRET` y `BLOB_READ_WRITE_TOKEN` en la configuración del proyecto de Vercel (Settings → Environment Variables).
4. **Provisionar almacenamiento** — Añade una base de datos **Neon PostgreSQL** y un almacenamiento **Vercel Blob** desde la pestaña Storage de Vercel. Las tablas requeridas son:
   - `users` — Cuentas de usuario
   - `user_lists` — Listas de reproducción
   - `songs_list` — Canciones dentro de las listas de reproducción (datos mínimos; enriquecidos en tiempo de lectura vía iTunes API)
5. **Desplegar** — Haz push a tu rama vinculada o ejecuta:

```bash
vercel --prod
```

La configuración `vercel.json` reescribe todas las peticiones `/api/*` a la función serverless de Express automáticamente.

## Estructura del Proyecto

```
├── api/                        # Backend Express (CommonJS)
│   ├── index.js                # Punto de entrada de la App (Vercel + local)
│   ├── middleware/
│   │   └── auth.js             # Middleware de autenticación JWT
│   └── routes/
│       ├── auth.js             # Registro / Inicio de sesión
│       ├── avatar.js           # Subida/borrado de imagen de perfil (Vercel Blob)
│       ├── music.js            # Búsqueda iTunes, lookup, tendencias
│       ├── playlists.js        # CRUD listas de reproducción y canciones
│       └── users.js            # Gestión de perfil de usuario
├── src/
│   ├── app/
│   │   ├── app.ts              # Componente raíz
│   │   ├── app.routes.ts       # Enrutamiento del lado del cliente
│   │   ├── app.config.ts       # Proveedores de la aplicación
│   │   ├── core/
│   │   │   ├── guards/         # Guardias de ruta (authGuard)
│   │   │   └── services/       # Servicios inyectables (state stores)
│   │   │       ├── audio-service.ts
│   │   │       ├── auth.service.ts
│   │   │       ├── music-service.ts
│   │   │       ├── playlist-service.ts
│   │   │       └── ...
│   │   └── shared/components/  # Componentes de UI (standalone)
│   │       ├── home/           # Página de inicio
│   │       ├── player-bar/     # Reproductor de audio global
│   │       ├── layout/         # Shell de la app (navbar + sidebar + router-outlet)
│   │       ├── playlist/       # Vistas de lista de reproducción
│   │       ├── profile/        # Página de perfil de usuario
│   │       └── ...
│   ├── custom-theme.scss       # Tema de Angular Material
│   └── styles.css              # Estilos globales
├── angular.json                # Configuración de Angular CLI
├── vercel.json                 # Reglas de enrutamiento/reescritura de Vercel
├── package.json
└── tsconfig.json
```

## Scripts

| Comando | Descripción |
|---|---|
| `npm install` | Instalar todas las dependencias del proyecto |
| `npm start` | Iniciar servidor de desarrollo Angular (`ng serve`) en `localhost:4200` |
| `npm run build` | Construcción de producción → `dist/AngularProyecto/` |
| `npm test` | Ejecutar pruebas unitarias con Karma + Jasmine |
| `node api/index.js` | Ejecutar el backend Express localmente |
| `vercel dev` | Ejecutar el full stack localmente (Angular + API) vía Vercel CLI |
| `vercel --prod` | Desplegar a producción en Vercel |

## Contribuir

Las contribuciones son bienvenidas. Para empezar:

1. **Haz un Fork** del repositorio.
2. **Crea una rama para tu funcionalidad** desde `main`:
   ```bash
   git checkout -b feat/mi-funcionalidad
   ```
3. **Haz Commit** de tus cambios siguiendo [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: añadir nueva funcionalidad"
   ```
4. **Haz Push** a tu fork y abre un **Pull Request**.

Por favor asegúrate de:
- El código sigue las convenciones existentes del proyecto (componentes standalone, signals, `inject()` para DI).
- Se aplica el formato Prettier (configurado en `package.json`: ancho 100 caracteres, comillas simples, parser Angular HTML).
- Los nuevos componentes usan archivos de plantilla/estilos `.html` y `.css` separados.
- Las APIs exclusivas del navegador están protegidas con verificaciones `isPlatformBrowser`.

## Licencia

Este proyecto es de código abierto y está disponible bajo la [Licencia MIT](LICENSE).
