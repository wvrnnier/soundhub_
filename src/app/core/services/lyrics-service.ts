import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class LyricsService {

  private http = inject(HttpClient);
  private apiUrl = 'https://lrclib.net/api/get';

  
  getLyrics(trackName: string, artistName: string, albumName: string, duration: number): Observable<any> {
    const params = new HttpParams()
      .set('track_name', trackName)
      .set('artist_name', artistName)
      .set('album_name', albumName)
      .set('duration', duration.toString());
    return this.http.get(this.apiUrl, { params });
  }
}