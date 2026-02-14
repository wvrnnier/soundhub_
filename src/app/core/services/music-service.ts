import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

const API_URL = '/api/music';

// ======================
// INTERFACES (normalizadas por el backend)
// ======================

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  albumId?: string;
  cover: string;
  previewUrl?: string;
  releaseDate?: string;
  duration?: number;
  genre?: string;
}

export interface Artist {
  id: string;
  name: string;
  genre?: string;
  artistLinkUrl?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  cover: string;
  releaseDate?: string;
  trackCount?: number;
  genre?: string;
  price?: number;
  currency?: string;
}

export interface SearchResponse {
  resultCount: number;
  entity: string;
  results: any[];
}

@Injectable({
  providedIn: 'root',
})
export class MusicService {
  constructor(private http: HttpClient) { }

  // DATOS PARA LA BÚSQUEDA DINÁMICA
  tracks = signal<Track[]>([]);
  albums = signal<Album[]>([]);
  isSearching = signal<boolean>(false);

  // DATOS FIJOS DEL HOME (PORTADA)
  homeTracks = signal<Track[]>([]);
  homeAlbums = signal<Album[]>([]);

  // DATOS PARA PORTADA
  searchSongs(query: string, limit = 24) {
    this.isSearching.set(true);
    this.http.get<SearchResponse>(`${API_URL}/search`, {
      params: { term: query, entity: 'song', limit: limit.toString() }
    }).subscribe((resp) => {
      this.tracks.set(resp.results as Track[]);
    });
  }

  searchTracks(query: string, limit: number): Observable<SearchResponse> {
    this.isSearching.set(true);
    return this.http.get<SearchResponse>(`${API_URL}/search`, {
      params: { term: query, entity: 'song', limit: limit.toString() }
    }).pipe(
      map(resp => {
        this.tracks.set(resp.results as Track[]);
        return resp;
      })
    );
  }

  searchArtists(term: string, limit: number = 20): Observable<SearchResponse> {
    return this.http.get<SearchResponse>(`${API_URL}/search`, {
      params: { term, entity: 'musicArtist', limit: limit.toString() }
    });
  }

  searchAlbums(query: string, limit = 24) {
    return this.http.get<SearchResponse>(`${API_URL}/search`, {
      params: { term: query, entity: 'album', limit: limit.toString() }
    }).pipe(
      map(resp => {
        this.albums.set(resp.results as Album[]);
        return resp;
      })
    );
  }

  clearSearch() {
    this.isSearching.set(false);
    this.tracks.set([]);
    this.albums.set([]);
  }

  // DETALLE POR ID

  getTrackById(id: string): Observable<Track> {
    return this.http.get<Track>(`${API_URL}/track/${id}`);
  }

  getAlbumWithTracks(albumId: string): Observable<any> {
    return this.http.get(`${API_URL}/album/${albumId}`);
  }

  getArtistWithTracks(artistId: string, limit: number = 20): Observable<any> {
    return this.http.get(`${API_URL}/artist/${artistId}`, {
      params: { limit: limit.toString() }
    });
  }

  // Buscar por ID localmente
  byId(id: string) {
    return this.tracks().find(t => t.id === id) ?? null;
  }

  // TRENDING (via backend proxy para evitar CORS, con caché local)
  getTrendingSongs() {
    if (this.homeTracks().length > 0) return; // ya cargados
    this.http
      .get<{ results: Track[] }>(`${API_URL}/trending/songs`)
      .subscribe((resp) => {
        this.homeTracks.set(resp.results);
      });
  }

  getTrendingAlbums() {
    if (this.homeAlbums().length > 0) return; // ya cargados
    this.http
      .get<{ results: Album[] }>(`${API_URL}/trending/albums`)
      .subscribe((resp) => {
        this.homeAlbums.set(resp.results);
      });
  }
}
