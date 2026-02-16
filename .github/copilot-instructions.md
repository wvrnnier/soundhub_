# Copilot Instructions — AngularProyecto

## Architecture Overview

Full-stack music streaming app: **Angular 20 SPA** (frontend) + **Express.js API** (backend), deployed on **Vercel**. Music data comes from the iTunes/Apple APIs; user data lives in **Neon PostgreSQL** (serverless). Avatars are stored in **Vercel Blob Storage**.

```
src/app/              → Angular frontend (standalone components, signals)
api/                  → Express backend (CommonJS, deployed as Vercel serverless function)
api/routes/           → REST routes: auth, music, playlists, users, avatar
src/app/core/services → Injectable services acting as state stores (signals + RxJS)
```

All routes render client-side only (`RenderMode.Client` in `app.routes.server.ts`) despite SSR infrastructure being present.

## Angular Conventions

- **All components are standalone** — no `NgModule`. Import dependencies directly in `@Component.imports`.
- **File naming**: `kebab-case.ts` (no `.component.ts` suffix). E.g., `player-bar.ts`, `side-bar.ts`.
- **Component classes**: PascalCase without "Component" suffix where practical (e.g., `PlayList`, `AlbumDetail`, `App`), though some keep it (`PlayerComponent`, `HomeComponent`).
- **Selectors**: `app-kebab-case`.
- **Zoneless**: The app uses `provideZonelessChangeDetection()` — all reactivity relies on signals, not zone.js change detection.
- **DI style is mixed**: services use both constructor injection (`private http: HttpClient`) and the `inject()` function. New code should prefer `inject()`.
- **Templates/styles**: Separate `.html` and `.css` files (not inline). Use `templateUrl`/`styleUrl`.

## State Management

No external store library. Services in `core/services/` act as stores:

- **Signals** (`signal()`, `computed()`, `asReadonly()`) are the primary reactive primitive — used in `AudioService`, `MusicService`, `PlaylistService`, `SearchStateService`.
- **Exception**: `AuthService` uses RxJS `BehaviorSubject` + `currentUser$` observable for user state.
- Components read signal references directly from services (e.g., `albums = this.music.homeAlbums;`) — no need for getters unless bridging to a non-signal template pattern.
- `PlaylistService` implements **localStorage caching with 10-min TTL** and optimistic UI updates via `tap()`.

## Backend API (`api/`)

- **CommonJS** (`require`/`module.exports`), not ES modules.
- **Database**: Neon PostgreSQL via `@neondatabase/serverless` — use **tagged template literals** (`sql\`SELECT ...\``) for parameterized queries.
- **Auth**: JWT Bearer tokens (24h expiry, `process.env.JWT_SECRET`). Middleware in `api/middleware/auth.js`. Applied at router level for playlists, users, avatar routes. Music and auth routes are public.
- **Tables**: `users`, `user_lists` (playlists), `songs_list` (tracks in playlists). Songs store minimal data (trackId, name, artist, cover); full metadata is **enriched at read-time** from iTunes API.
- **Caching**: In-memory caches for iTunes search (5 min) and trending data (1 hour).
- **`api/index.js`** both exports `app` (Vercel) and calls `app.listen()` (local dev).

## Key External APIs

| Service | Usage | Called From |
|---|---|---|
| iTunes Search/Lookup API | Music search, track/album/artist details, song enrichment | `api/routes/music.js`, `api/routes/playlists.js` |
| Apple RSS Feed | Trending songs/albums (Spain) | `api/routes/music.js` |
| lrclib.net | Lyrics lookup | `src/app/core/services/lyrics-service.ts` (client-side) |
| Vercel Blob Storage | Avatar upload/delete | `api/routes/avatar.js` |

## Auth Flow

- Frontend stores JWT + user object in `localStorage` (managed by `AuthService`).
- No HTTP interceptor — each service manually builds `Authorization: Bearer ${token}` headers via helper methods.
- Protected routes use the functional `authGuard` (`CanActivateFn` + `inject()`).

## Project Commands

| Command | Purpose |
|---|---|
| `npm start` / `ng serve` | Dev server at `localhost:4200` |
| `npm test` / `ng test` | Unit tests via Karma + Jasmine |
| `ng build` | Production build → `dist/AngularProyecto/` |
| `node api/index.js` | Run backend locally (needs `.env.local` with `SHDB_DATABASE_URL`, `JWT_SECRET`, `BLOB_READ_WRITE_TOKEN`) |

## Component Layout

`App` → `PlayerBarComponent` (global audio player, always visible) + `<router-outlet>`.  
`LayoutComponent` (shell for all pages) → `NavBarComponent` + `SideBarComponent` + `<router-outlet>`.  
`SideBarComponent` shows playlists and library songs; uses `@HostBinding` for expand/collapse and `CUSTOM_ELEMENTS_SCHEMA` for `iconify-icon` web components.

## Patterns to Follow

- Guard browser-only APIs (e.g., `HTMLAudioElement`, `localStorage`) with `isPlatformBrowser` checks — see `AudioService` for reference.
- Use `CUSTOM_ELEMENTS_SCHEMA` when using `<iconify-icon>` elements in templates.
- Playlist mutations should invalidate localStorage cache — follow the pattern in `PlaylistService.invalidateCache()`.
- Prettier is configured in `package.json`: 100 char width, single quotes, Angular HTML parser.
- Commit messages follow **Conventional Commits** (e.g., `feat:`, `fix:`, `refactor:`, `chore:`).
