import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { SearchResponse, Track } from './music-service';

const PLAYLIST_API_URL = '/api/playlists';
const MUSIC_API_URL = '/api/music';

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
  private readonly playlistsState = signal<PlaylistSummary[]>([]);
  private readonly librarySongsState = signal<PlaylistSong[]>([]);

  readonly playlists = this.playlistsState.asReadonly();
  readonly librarySongs = this.librarySongsState.asReadonly();

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {}

  clearState(): void {
    this.playlistsState.set([]);
    this.librarySongsState.set([]);
  }

  loadPlaylists(): Observable<PlaylistSummary[]> {
    return this.http
      .get<PlaylistSummary[]>(PLAYLIST_API_URL, {
        headers: this.getAuthHeaders(),
      })
      .pipe(tap((playlists) => this.playlistsState.set(playlists)));
  }

  loadLibrarySongs(limit = 8): Observable<PlaylistSong[]> {
    return this.http
      .get<PlaylistSong[]>(`${PLAYLIST_API_URL}/library/songs`, {
        headers: this.getAuthHeaders(),
        params: new HttpParams().set('limit', limit.toString()),
      })
      .pipe(tap((songs) => this.librarySongsState.set(songs)));
  }

  loadPlaylist(playlistId: number): Observable<PlaylistDetail> {
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
        }),
      );
  }

  createPlaylist(name: string): Observable<PlaylistSummary> {
    return this.http
      .post<PlaylistSummary>(
        PLAYLIST_API_URL,
        { name },
        { headers: this.getAuthHeaders() },
      )
      .pipe(
        tap((playlist) => {
          this.playlistsState.update((playlists) => [playlist, ...playlists]);
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
        }),
      );
  }

  addSongToPlaylist(
    playlistId: number,
    track: Track,
  ): Observable<PlaylistSong> {
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
                  currentSong.playlistId === song.playlistId &&
                  currentSong.trackId === song.trackId
                ),
            );
            return [song, ...withoutDuplicate];
          });
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
            songs.filter(
              (song) =>
                !(song.playlistId === playlistId && song.trackId === trackId),
            ),
          );
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

  private upsertPlaylist(playlistSummary: PlaylistSummary): void {
    this.playlistsState.update((playlists) => {
      const playlistExists = playlists.some(
        (playlist) => playlist.id === playlistSummary.id,
      );

      if (!playlistExists) {
        return [playlistSummary, ...playlists];
      }

      return playlists.map((playlist) =>
        playlist.id === playlistSummary.id ? playlistSummary : playlist,
      );
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }
}
