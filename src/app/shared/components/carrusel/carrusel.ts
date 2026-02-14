import { Component, input, signal, computed, effect, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackCardComponent } from '../track-card/track-card';
import { AlbumComponent } from '../album/album';

@Component({
  selector: 'app-carrusel',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  imports: [CommonModule, TrackCardComponent, AlbumComponent],
  templateUrl: './carrusel.html',
  styleUrl: './carrusel.css',
})
export class CarruselComponent {
  //recibe una lista cualquiera
  items = input.required<any[]>();

  // el tipo de la lista
  type = input.required<'track' | 'album'>();

  itemsPerView = 5; //eligo numero de album en el carrusel
  page = signal(0);
  animating = signal(false);

  // Placeholders para shimmer
  placeholders = Array(5).fill(0);

  isLoading = computed(() => this.items().length === 0);

  totalPages = computed(() => Math.ceil(this.items().length / this.itemsPerView));

  visibleItems = computed(() => {
    const start = this.page() * this.itemsPerView;
    return this.items().slice(start, start + this.itemsPerView);
  });

  next() {
    if (this.page() < this.totalPages() - 1) {
      this.triggerAnimation();
      this.page.update((p) => p + 1);
    }
  }

  prev() {
    if (this.page() > 0) {
      this.triggerAnimation();
      this.page.update((p) => p - 1);
    }
  }

  private triggerAnimation() {
    this.animating.set(true);
    setTimeout(() => this.animating.set(false), 400);
  }
}
