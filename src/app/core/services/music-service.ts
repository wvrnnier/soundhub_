import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Track {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  previewUrl: string;
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
    return this.http
      .get<any>(url)
      .pipe(map((resp) => resp.results[0] as Track));
  }
}
