import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { SearchResponse, Track } from './music-service';

// Endpoints HTTP usados por este servicio.
const PLAYLIST_API_URL = '/api/playlists';
const MUSIC_API_URL = '/api/music';

// Claves de caché en localStorage
const CACHE_KEYS = {
  PLAYLISTS: 'cache_playlists',
  LIBRARY_SONGS: 'cache_library_songs',
  PLAYLIST_DETAIL: (id: number) => `cache_playlist_${id}`,
} as const;

const CACHE_TTL_MS = 10 * 60 * 1000;

// Tipos de respuesta/estado para playlist.
export interface PlaylistSummary {
  id: number;
  listName: string;
  createdAt: string;
  songCount: number;
}

export interface PlaylistSong {
  id: number;
  playlistId: number;
  playlistName: string;
  trackId: string;
  title: string;
  artist: string;
  cover: string;
  previewUrl: string | null;
  album: string | null;
  duration: number | null;
  genre: string | null;
}

export interface PlaylistDetail extends PlaylistSummary {
  songs: PlaylistSong[];
}

@Injectable({
  providedIn: 'root',
})
export class PlaylistService {
  // Estado interno mutable.
  private readonly playlistsState = signal<PlaylistSummary[]>([]);
  private readonly librarySongsState = signal<PlaylistSong[]>([]);

  // Estado publico (solo lectura).
  readonly playlists = this.playlistsState.asReadonly();
  readonly librarySongs = this.librarySongsState.asReadonly();

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {
    // Restaurar estado desde caché al iniciar
    this.restoreFromCache();
  }

  // ========================
  // Lectura de datos
  // ========================

  clearState(): void {
    this.playlistsState.set([]);
    this.librarySongsState.set([]);
    this.clearAllCache();
  }

  loadPlaylists(): Observable<PlaylistSummary[]> {
    // Si la caché es válida y ya tenemos datos, no hacemos petición
    if (this.playlistsState().length > 0 && this.isCacheValid(CACHE_KEYS.PLAYLISTS)) {
      return of(this.playlistsState());
    }

    return this.http
      .get<PlaylistSummary[]>(PLAYLIST_API_URL, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((playlists) => {
          this.playlistsState.set(playlists);
          this.saveToCache(CACHE_KEYS.PLAYLISTS, playlists);
        }),
      );
  }

  loadLibrarySongs(limit = 8): Observable<PlaylistSong[]> {
    if (this.librarySongsState().length > 0 && this.isCacheValid(CACHE_KEYS.LIBRARY_SONGS)) {
      return of(this.librarySongsState());
    }

    return this.http
      .get<PlaylistSong[]>(`${PLAYLIST_API_URL}/library/songs`, {
        headers: this.getAuthHeaders(),
        params: new HttpParams().set('limit', limit.toString()),
      })
      .pipe(
        tap((songs) => {
          this.librarySongsState.set(songs);
          this.saveToCache(CACHE_KEYS.LIBRARY_SONGS, songs);
        }),
      );
  }

  loadPlaylist(playlistId: number): Observable<PlaylistDetail> {
    const cacheKey = CACHE_KEYS.PLAYLIST_DETAIL(playlistId);
    const cached = this.loadFromCache<PlaylistDetail>(cacheKey);

    if (cached) {
      // Actualizar el estado inmediatamente con la caché
      this.upsertPlaylist({
        id: cached.id,
        listName: cached.listName,
        createdAt: cached.createdAt,
        songCount: cached.songCount,
      });
      return of(cached);
    }

    return this.http
      .get<PlaylistDetail>(`${PLAYLIST_API_URL}/${playlistId}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((playlist) => {
          this.upsertPlaylist({
            id: playlist.id,
            listName: playlist.listName,
            createdAt: playlist.createdAt,
            songCount: playlist.songCount,
          });
          this.saveToCache(cacheKey, playlist);
        }),
      );
  }

  // ========================
  // Mutaciones de datos
  // ========================

  createPlaylist(name: string): Observable<PlaylistSummary> {
    return this.http
      .post<PlaylistSummary>(PLAYLIST_API_URL, { name }, { headers: this.getAuthHeaders() })
      .pipe(
        tap((playlist) => {
          this.playlistsState.update((playlists) => [playlist, ...playlists]);
          this.invalidateCache(CACHE_KEYS.PLAYLISTS);
        }),
      );
  }

  renamePlaylist(playlistId: number, name: string): Observable<PlaylistSummary> {
    //usa PATCH /api/playlists/:id sino hay en backend no vale
    const currentSummary = this.playlistsState().find((playlist) => playlist.id === playlistId);

    return this.http
      .patch<Partial<PlaylistSummary> | null>(
        `${PLAYLIST_API_URL}/${playlistId}`,
        { name },
        { headers: this.getAuthHeaders() },
      )
      .pipe(
        map((response) => {
          const payload = response ?? {};
          const payloadWithName = payload as Partial<PlaylistSummary> & { name?: string };

          return {
            id: playlistId,
            listName: payloadWithName.listName ?? payloadWithName.name ?? name,
            createdAt: payload.createdAt ?? currentSummary?.createdAt ?? new Date().toISOString(),
            songCount: payload.songCount ?? currentSummary?.songCount ?? 0,
          } as PlaylistSummary;
        }),
        tap((updatedSummary) => {
          this.upsertPlaylist(updatedSummary);

          this.librarySongsState.update((songs) =>
            songs.map((song) =>
              song.playlistId === playlistId
                ? { ...song, playlistName: updatedSummary.listName }
                : song,
            ),
          );

          this.invalidateCache(CACHE_KEYS.PLAYLISTS);
          this.invalidateCache(CACHE_KEYS.LIBRARY_SONGS);
          this.invalidateCache(CACHE_KEYS.PLAYLIST_DETAIL(playlistId));
        }),
      );
  }

  deletePlaylist(playlistId: number): Observable<void> {
    return this.http
      .delete<void>(`${PLAYLIST_API_URL}/${playlistId}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap(() => {
          this.playlistsState.update((playlists) =>
            playlists.filter((playlist) => playlist.id !== playlistId),
          );

          this.librarySongsState.update((songs) =>
            songs.filter((song) => song.playlistId !== playlistId),
          );

          this.invalidateCache(CACHE_KEYS.PLAYLISTS);
          this.invalidateCache(CACHE_KEYS.LIBRARY_SONGS);
          this.invalidateCache(CACHE_KEYS.PLAYLIST_DETAIL(playlistId));
        }),
      );
  }

  addSongToPlaylist(playlistId: number, track: Track): Observable<PlaylistSong> {
    return this.http
      .post<PlaylistSong>(
        `${PLAYLIST_API_URL}/${playlistId}/songs`,
        {
          trackId: track.id,
          title: track.title,
          artist: track.artist,
          cover: track.cover,
        },
        { headers: this.getAuthHeaders() },
      )
      .pipe(
        tap((song) => {
          this.playlistsState.update((playlists) =>
            playlists.map((playlist) =>
              playlist.id === playlistId
                ? { ...playlist, songCount: playlist.songCount + 1 }
                : playlist,
            ),
          );

          this.librarySongsState.update((songs) => {
            const withoutDuplicate = songs.filter(
              (currentSong) =>
                !(
                  currentSong.playlistId === song.playlistId && currentSong.trackId === song.trackId
                ),
            );
            return [song, ...withoutDuplicate];
          });

          // Invalidar cachés afectadas por la mutación
          this.invalidateCache(CACHE_KEYS.PLAYLISTS);
          this.invalidateCache(CACHE_KEYS.LIBRARY_SONGS);
          this.invalidateCache(CACHE_KEYS.PLAYLIST_DETAIL(playlistId));
        }),
      );
  }

  removeSongFromPlaylist(playlistId: number, trackId: string): Observable<void> {
    return this.http
      .delete<void>(`${PLAYLIST_API_URL}/${playlistId}/songs/${trackId}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap(() => {
          this.playlistsState.update((playlists) =>
            playlists.map((playlist) =>
              playlist.id === playlistId
                ? {
                    ...playlist,
                    songCount: Math.max(playlist.songCount - 1, 0),
                  }
                : playlist,
            ),
          );

          this.librarySongsState.update((songs) =>
            songs.filter((song) => !(song.playlistId === playlistId && song.trackId === trackId)),
          );

          // Invalidar cachés afectadas por la mutación
          this.invalidateCache(CACHE_KEYS.PLAYLISTS);
          this.invalidateCache(CACHE_KEYS.LIBRARY_SONGS);
          this.invalidateCache(CACHE_KEYS.PLAYLIST_DETAIL(playlistId));
        }),
      );
  }

  searchTracks(query: string, limit = 12): Observable<Track[]> {
    return this.http
      .get<SearchResponse>(`${MUSIC_API_URL}/search`, {
        params: {
          term: query,
          entity: 'song',
          limit: limit.toString(),
        },
      })
      .pipe(map((response) => response.results as Track[]));
  }

  // ========================
  // Helpers internos de estado
  // ========================

  private upsertPlaylist(playlistSummary: PlaylistSummary): void {
    this.playlistsState.update((playlists) => {
      const playlistExists = playlists.some((playlist) => playlist.id === playlistSummary.id);

      if (!playlistExists) {
        return [playlistSummary, ...playlists];
      }

      return playlists.map((playlist) =>
        playlist.id === playlistSummary.id ? playlistSummary : playlist,
      );
    });
  }

  // Header Authorization para rutas protegidas.
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  // ========================
  // CACHÉ — localStorage
  // ========================

  /** Guarda datos en localStorage con timestamp */
  private saveToCache<T>(key: string, data: T): void {
    try {
      const entry = { data, timestamp: Date.now() };
      localStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // localStorage lleno o no disponible — no bloquear la app
    }
  }

  /** Lee datos de localStorage si no han expirado */
  private loadFromCache<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const entry = JSON.parse(raw) as { data: T; timestamp: number };
      if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        localStorage.removeItem(key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  /** Comprueba si una clave de caché sigue siendo válida */
  private isCacheValid(key: string): boolean {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return false;

      const entry = JSON.parse(raw) as { timestamp: number };
      return Date.now() - entry.timestamp <= CACHE_TTL_MS;
    } catch {
      return false;
    }
  }

  /** Invalida una clave de caché concreta */
  private invalidateCache(key: string): void {
    localStorage.removeItem(key);
  }

  /** Limpia toda la caché de playlists */
  private clearAllCache(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cache_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  /** Restaura el estado de signals desde la caché al arrancar */
  private restoreFromCache(): void {
    const cachedPlaylists = this.loadFromCache<PlaylistSummary[]>(CACHE_KEYS.PLAYLISTS);
    if (cachedPlaylists) {
      this.playlistsState.set(cachedPlaylists);
    }

    const cachedSongs = this.loadFromCache<PlaylistSong[]>(CACHE_KEYS.LIBRARY_SONGS);
    if (cachedSongs) {
      this.librarySongsState.set(cachedSongs);
    }
  }
}
