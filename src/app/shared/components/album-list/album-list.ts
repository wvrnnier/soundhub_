import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MusicService } from '../../../core/services/music-service';
import { CarruselComponent } from '../carrusel/carrusel';

@Component({
  selector: 'app-album-list',
  standalone: true,
  imports: [CommonModule, CarruselComponent],
  templateUrl: './album-list.html',
})
export class AlbumListComponent implements OnInit {
  music = inject(MusicService);

  albums = this.music.albums;

  query = 'queen'; // o ‘a’ si quieres más resultados

  ngOnInit() {
    this.music.searchAlbums(this.query);
  }
}
