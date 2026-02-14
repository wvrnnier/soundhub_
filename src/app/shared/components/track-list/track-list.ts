import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MusicService, Track } from '../../../core/services/music-service';
import { TrackCardComponent } from '../track-card/track-card';
import { AlbumComponent } from '../album/album';

@Component({
  selector: 'app-track-list',
  standalone: true,
  imports: [CommonModule, TrackCardComponent, AlbumComponent],
  templateUrl: './track-list.html',
  styleUrl: './track-list.css',
})
export class TrackListComponent implements OnInit {
  // 1) Inyecto el servicio
  music = inject(MusicService);

  // 2) Obtengo la señal de tracks de forma dinámica
  tracks = computed(() => {
    return this.music.isSearching() ? this.music.tracks() : this.music.homeTracks();
  });

  albums = computed(() => {
    return this.music.isSearching() ? this.music.albums() : this.music.homeAlbums();
  });

  ngOnInit() {
    // Reutilizo las homeTracks (trending ES) si ya están cargadas
    this.music.getTrendingSongs();
    this.music.getTrendingAlbums();
  }
}
