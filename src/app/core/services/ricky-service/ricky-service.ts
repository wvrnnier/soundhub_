import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class RickyService {
  characters = signal<any[]>([]);

  constructor(private http: HttpClient) {}

  loadCharacters() {
    this.http.get<any>('https://rickandmortyapi.com/api/character').subscribe((resp) => {
      this.characters.set(resp.results);
    });
  }
}
