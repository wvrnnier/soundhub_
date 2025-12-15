import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

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
  artworkUrl100: string;
}

@Injectable({
  providedIn: 'root',
})
export class MusicService {
  tracks = signal<Track[]>([]);
  artists = signal<Artist[]>([]);

  constructor(private http: HttpClient) {}

  searchSongs(query: string, limit = 24, offset = 0) {
    const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=${limit}&offset=${offset}`;
    this.http.get<any>(url).subscribe((resp) => {
      this.tracks.set(resp.results as Track[]);
    });
  }

  searchArtists(query: string, limit = 24) {
    const url = `https://itunes.apple.com/search?term=${query}&entity=musicArtist&limit=${limit}`;
    this.http.get<any>(url).subscribe((resp) => {
      this.artists.set(resp.results as Artist[]);
    });
  }

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
