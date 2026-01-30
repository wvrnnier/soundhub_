import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// ======================
// INTERFACES REALES
// ======================

export interface Track {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  previewUrl: string;
  collectionName: string;
  trackTimeMillis: number;
}

export interface Artist {
  artistId: number;
  artistName: string;
  primaryGenreName: string;
  image?: string | null; // Imagen REAL añadida después
}

export interface Album {
  collectionId: number;
  collectionName: string;
  artistName: string;
  artworkUrl100: string;
  trackCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class MusicService {
  constructor(private http: HttpClient) { }

  // DATOS PARA LA BÚSQUEDA DINÁMICA

  tracks = signal<Track[]>([]);
  artists = signal<Artist[]>([]);
  albums = signal<Album[]>([]);
  isSearching = signal<boolean>(false);

  // DATOS FIJOS DEL HOME (PORTADA)

  homeTracks = signal<Track[]>([]);
  homeArtists = signal<Artist[]>([]);
  homeAlbums = signal<Album[]>([]);

  //  DATOS PARA PORTADA

  loadHomeSongs(limit = 24) {
    const url = `https://itunes.apple.com/search?term=a&entity=song&limit=${limit}`;
    this.http.get<any>(url).subscribe((resp) => {
      this.homeTracks.set(resp.results as Track[]);
    });
  }

  loadHomeAlbums(limit = 24) {
    const url = `https://itunes.apple.com/search?term=a&entity=album&limit=${limit}`;
    this.http.get<any>(url).subscribe((resp) => {
      this.homeAlbums.set(resp.results as Album[]);
    });
  }

  loadHomeArtists(limit = 24) {
    const url = `https://itunes.apple.com/search?term=a&entity=musicArtist&limit=${limit}`;
    this.http.get<any>(url).subscribe((resp) => {
      const rawArtists = resp.results as Artist[];

      // Añadir imagen real usando una canción del artista
      rawArtists.forEach((artist) => {
        this.getArtistImage(artist.artistName).subscribe((img) => {
          artist.image = img;
          this.homeArtists.set([...rawArtists]); // actualiza señal del home
        });
      });
    });
  }

  // OBTENER IMAGEN REAL DE ARTISTAS DESDE CANCIONES
  getArtistImage(artistName: string): Observable<string | null> {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      artistName
    )}&entity=song&limit=1`;

    return this.http.get<any>(url).pipe(map((resp) => resp.results?.[0]?.artworkUrl100 ?? null));
  }

  // BÚSQUEDAS DINÁMICAS

  searchSongs(query: string, limit = 24, offset = 0) {
    this.isSearching.set(true);
    const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=${limit}&offset=${offset}`;
    this.http.get<any>(url).subscribe((resp) => {
      this.tracks.set(resp.results as Track[]);
    });
  }

  // Método adaptado para el código del usuario que espera un Observable
  searchTracks(query: string, limit: number): Observable<any> {
    this.isSearching.set(true);
    const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=${limit}`;
    return this.http.get<any>(url).pipe(
      map(resp => {
        // Actualizamos también la señal global para que el resto de la app (Home/Tracks) reacione
        this.tracks.set(resp.results as Track[]);
        return resp;
      })
    );
  }

  clearSearch() {
    this.isSearching.set(false);
    this.tracks.set([]);
  }

  searchAlbums(query: string, limit = 24, offset = 0) {
    const url = `https://itunes.apple.com/search?term=${query}&entity=album&limit=${limit}&offset=${offset}`;
    this.http.get<any>(url).subscribe((resp) => {
      this.albums.set(resp.results as Album[]);
    });
  }

  searchArtists(query: string, limit = 24) {
    const url = `https://itunes.apple.com/search?term=${query}&entity=musicArtist&limit=${limit}`;

    this.http.get<any>(url).subscribe((resp) => {
      const rawArtists = resp.results as Artist[];

      // Añadir imagen real desde canciones
      rawArtists.forEach((artist) => {
        this.getArtistImage(artist.artistName).subscribe((img) => {
          artist.image = img;
          this.artists.set([...rawArtists]); // actualiza señal
        });
      });
    });
  }

  // DETALLE DE TRACK

  getTrackById(id: number): Observable<Track> {
    const url = `https://itunes.apple.com/lookup?id=${id}`;
    return this.http.get<any>(url).pipe(map((resp) => resp.results[0] as Track));
  }

  getTrendingSongs() {
    //primera peticion para obtener id de ranking itunes no la da
    const rssUrl = 'https://rss.applemarketingtools.com/api/v2/us/music/most-played/24/songs.json';

    this.http
      .get<any>(rssUrl)
      .pipe(
        map((response) => response.feed.results.map((track: any) => track.id)),
        switchMap((ids) => {
          if (ids.length === 0) {
            return of({ results: [] });
          }
          //aqui ya obtengo con los id las canciones
          const lookupUrl = `https://itunes.apple.com/lookup?id=${ids.join(',')}`;
          return this.http.get<any>(lookupUrl);
        })
      )
      .subscribe((response) => {
        this.tracks.set(response.results as Track[]);
      });
  }
}
