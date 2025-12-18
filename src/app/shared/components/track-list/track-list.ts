import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MusicService, Track } from '../../../core/services/music-service';
import { TrackCardComponent } from '../track-card/track-card';
import { CarruselComponent } from '../carrusel/carrusel';

@Component({
  selector: 'app-track-list',
  standalone: true,
  imports: [CommonModule, TrackCardComponent],
  templateUrl: './track-list.html',
  styleUrl: './track-list.css',
})
export class TrackListComponent implements OnInit {
  // 1) Inyecto el servicio
  music = inject(MusicService);

  // 2) Obtengo la señal de tracks desde el servicio
  tracks = this.music.homeTracks;
  ngOnInit() {
    // 3) Pido los datos
    this.music.loadHomeSongs();
  }
}
