import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MusicService } from '../../../core/services/music-service';
import { CarruselComponent } from '../carrusel/carrusel';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CarruselComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit {
  music = inject(MusicService);

  // signals para datos fijos
  albums = this.music.homeAlbums;
  tracks = this.music.homeTracks;

  ngOnInit() {
    this.music.getTrendingSongs().subscribe();
    this.music.getTrendingAlbums().subscribe();
  }
}
