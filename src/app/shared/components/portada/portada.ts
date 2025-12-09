import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MusicService } from '../../../core/services/music-service';
import { CarruselComponent } from '../carrusel/carrusel';

@Component({
  selector: 'app-portada',
  standalone: true,
  imports: [CommonModule, CarruselComponent],
  templateUrl: './portada.html',
  styleUrls: ['./portada.css'],
})
export class PortadaComponent implements OnInit {
  music = inject(MusicService);

  // signals para datos fijos
  albums = this.music.homeAlbums;
  tracks = this.music.homeTracks;
  artists = this.music.homeArtists;

  ngOnInit() {
    // cargo los datos fijos
    this.music.loadHomeAlbums();
    this.music.loadHomeArtists();
    this.music.loadHomeSongs();
  }
}
