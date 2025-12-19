import { Component, inject } from '@angular/core';
import { MusicService } from '../../../core/services/music-service';
import { TrackCardComponent } from '../track-card/track-card';
import { CarruselComponent } from '../carrusel/carrusel';

@Component({
  selector: 'app-track-carrusel',
  imports: [TrackCardComponent, CarruselComponent],
  templateUrl: './track-carrusel.html',
  styleUrl: './track-carrusel.css',
})
export class TrackCarrusel {
  musicService = inject(MusicService);
  trackCarrusel = this.musicService.homeTracks;
}
