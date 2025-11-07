import { Injectable, signal } from '@angular/core';

export interface Track {
  id: string;
  tittle: string;
  artist: string;
  cover: string;
  previewurl?: string;
}
@Injectable({ providedIn: 'root' })
export class MusicService {
  private _tracks = signal<Track[]>([
    { id: '1', tittle: 'Track 1', artist: 'Artist 1', cover: 'cover1.jpg', previewurl: 'preview1.mp3' },
    { id: '2', tittle: 'Track 2', artist: 'Artist 2', cover: 'cover2.jpg', previewurl: 'preview2.mp3' },
    { id: '3', tittle: 'Track 3', artist: 'Artist 3', cover: 'cover3.jpg', previewurl: 'preview3.mp3' },
  ]);
private _favs = signal<string[]>([]);

constructor() {
  this._favs.set(this.loadFavs());
}

private loadFavs(): string[] {
  try {
    const raw = localStorage.getItem('soundhub_favs');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
  tracks = () => this._tracks();
  favs = () => this._favs();
  byId(id: string) {
    return this._tracks().find((track) => track.id === id);
  }
  toggleFav(id: string) {
    const set = new Set(this._favs());
    set.has(id) ? set.delete(id) : set.add(id);
    const arr = [...set];
    this._favs.set(arr);
    localStorage.setItem('soundhub_favs', JSON.stringify(arr));
  }
  search(term: string) {
    term = term.toLowerCase().trim();
    if (!term) return this.tracks();
    return this._tracks().filter(t =>
      t.tittle.toLowerCase().includes(term) ||
      t.artist.toLowerCase().includes(term)
    );
  }
}
