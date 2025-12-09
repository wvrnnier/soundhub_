import { ArtistCardComponent } from './../artist-card/artist-card';
import { Component, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackCardComponent } from '../track-card/track-card';
import { AlbumComponent } from '../album/album';

@Component({
  selector: 'app-carrusel',
  standalone: true,
  imports: [CommonModule, TrackCardComponent, AlbumComponent, ArtistCardComponent],
  templateUrl: './carrusel.html',
  styleUrl: './carrusel.css',
})
export class CarruselComponent {
  //recibine una lista cualquiera
  items = input.required<any[]>();

  // el tipo de la lista
  type = input.required<'track' | 'album' | 'artist'>();

  itemsPerView = 5; //cuantos quiero q aparesca
  page = signal(0);

  totalPages = computed(() => Math.ceil(this.items().length / this.itemsPerView));

  visibleItems = computed(() => {
    const start = this.page() * this.itemsPerView;
    return this.items().slice(start, start + this.itemsPerView);
  });

  next() {
    if (this.page() < this.totalPages() - 1) this.page.update((p) => p + 1);
  }

  prev() {
    if (this.page() > 0) this.page.update((p) => p - 1);
  }
}
