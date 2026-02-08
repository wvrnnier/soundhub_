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
  constructor(private http: HttpClient) {}

  // DATOS PARA LA BÚSQUEDA DINÁMICA
  tracks = signal<Track[]>([]);
  albums = signal<Album[]>([]);
  isSearching = signal<boolean>(false);

  // DATOS FIJOS DEL HOME (PORTADA)
  homeTracks = signal<Track[]>([]);
  homeAlbums = signal<Album[]>([]);

  // DATOS PARA PORTADA

  loadHomeSongs(limit = 24) {
    this.http.get<SearchResponse>(`${API_URL}/search`, {
      params: { term: 'a', entity: 'song', limit: limit.toString() }
    }).subscribe((resp) => {
      this.homeTracks.set(resp.results as Track[]);
    });
  }

  loadHomeAlbums(limit = 24) {
    this.http.get<SearchResponse>(`${API_URL}/search`, {
      params: { term: 'a', entity: 'album', limit: limit.toString() }
    }).subscribe((resp) => {
      this.homeAlbums.set(resp.results as Album[]);
    });
  }

  // BÚSQUEDAS DINÁMICAS

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
    this.http.get<SearchResponse>(`${API_URL}/search`, {
      params: { term: query, entity: 'album', limit: limit.toString() }
    }).subscribe((resp) => {
      this.albums.set(resp.results as Album[]);
    });
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

  // TRENDING (Apple RSS + lookup vía backend)
  getTrendingSongs() {
    const rssUrl = 'https://rss.applemarketingtools.com/api/v2/us/music/most-played/24/songs.json';

    this.http
      .get<any>(rssUrl)
      .pipe(
        map((response) => response.feed.results.map((track: any) => track.id)),
        switchMap((ids: string[]) => {
          if (ids.length === 0) return of([]);
          const lookups = ids.map((id: string) => this.getTrackById(id));
          return forkJoin(lookups);
        })
      )
      .subscribe((tracks) => {
        this.tracks.set(tracks as Track[]);
      });
  }
}
