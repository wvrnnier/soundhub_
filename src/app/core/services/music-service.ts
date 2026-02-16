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





  // TRENDING (via backend proxy para evitar CORS, con caché local)
  // TRENDING (via backend proxy para evitar CORS, con caché local)
  getTrendingSongs(): Observable<Track[]> {
    if (this.homeTracks().length > 0) return of(this.homeTracks());

    return this.http
      .get<{ results: Track[] }>(`${API_URL}/trending/songs`)
      .pipe(
        map(resp => resp.results),
        // Efecto secundario: actualizar la señal
        switchMap(tracks => {
          this.homeTracks.set(tracks);
          return of(tracks);
        })
      );
  }

  getTrendingAlbums(): Observable<Album[]> {
    if (this.homeAlbums().length > 0) return of(this.homeAlbums());

    return this.http
      .get<{ results: Album[] }>(`${API_URL}/trending/albums`)
      .pipe(
        map(resp => resp.results),
        switchMap(albums => {
          this.homeAlbums.set(albums);
          return of(albums);
        })
      );
  }
}
