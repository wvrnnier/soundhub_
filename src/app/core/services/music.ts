import { Injectable, signal } from '@angular/core';

export interface Track { //define la forma de la canción
  id: string;
  title: string;
  artist: string;
  cover: string;
  previewUrl?: string;
}

@Injectable({ providedIn: 'root' })// Declaramos el servicio y lo va a registrar en el root injector
export class MusicService {
  private _tracks = signal<Track[]>([ // lista de canciones
    { id: '1', title: 'Neon Nights',    artist: 'Citywave', cover: 'https://picsum.photos/seed/a/400' },
    { id: '2', title: 'Echoes',         artist: 'Aurelia',  cover: 'https://picsum.photos/seed/b/400' },
    { id: '3', title: 'Midnight Drive', artist: 'Sinthex',  cover: 'https://picsum.photos/seed/c/400' },
  ]);

  private _favs = signal<string[]>([]);// Lista de ids de las canciones

  constructor() { // carga las canciones favs
    this._favs.set(this.loadFavs());
  }

  tracks = () => this._tracks(); //Getters que son funciones, devolvemos el aaray actual y el de ids
  favs   = () => this._favs();

  byId(id: string) { // Buscamos canciones por id y devolvemos null si no existe
    return this._tracks().find(t => t.id === id) ?? null;
  }

  toggleFav(id: string) {  // Añade o elimina una canción de favs
    const set = new Set(this._favs()); // Copiamos set para no duplicar
    set.has(id) ? set.delete(id) : set.add(id); // Si existe lo elimina, si no lo añade
    const arr = [...set]; // Convertimos el set a array
    this._favs.set(arr); // Actualizamos el signal
    localStorage.setItem('soundhub_favs', JSON.stringify(arr)); // Guardamos en localstorage
  }

  search(term: string) { // Buscamos las canciones por titulo o artista
    term = term.toLowerCase().trim(); // Normalizamos el texto
    if (!term) return this._tracks(); // Si no hay texto devolvemos todo
    return this._tracks().filter(t => // Filtramos las canciones
      t.title.toLowerCase().includes(term) || 
      t.artist.toLowerCase().includes(term) 
    ); // Devolvemos las canciones que coinciden
  }

  private loadFavs(): string[] { // Cargamos las favs desde localstorage
    try { 
      const raw = localStorage.getItem('soundhub_favs'); 
      return raw ? JSON.parse(raw) : []; 
    } catch {  
      return []; 
    } 
  } 
}
