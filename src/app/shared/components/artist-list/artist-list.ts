import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MusicService } from '../../../core/services/music-service';
import { CarruselComponent } from '../carrusel/carrusel';

@Component({
  selector: 'app-artist-list',
  standalone: true,
  imports: [CommonModule, CarruselComponent],
  templateUrl: './artist-list.html',
})
export class ArtistListComponent implements OnInit {
  music = inject(MusicService);

  artists = this.music.artists;

  query = 'a'; // búsqueda amplia para obtener muchos resultados

  ngOnInit() {
    this.music.searchArtists(this.query);
  }
}
