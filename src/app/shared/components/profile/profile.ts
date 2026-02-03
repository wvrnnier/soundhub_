import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MusicService } from '../../../core/services/music-service';
import { TrackCardComponent } from '../track-card/track-card';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, TrackCardComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit {
  music = inject(MusicService);

  user = {
    name: 'Usuario Invitado',
    image: 'https://i.scdn.co/image/ab6761610000e5eb55d39ab9c22d51e4d94380f2', // Placeholder style
    playlists: 4
  };

  // Reutilizamos datos del servicio para simular "Top"
  topTracks = this.music.homeTracks;

  ngOnInit() {
    // Aseguramos que haya datos cargados
    if (this.topTracks().length === 0) {
      this.music.loadHomeSongs();
    }
  }
}
