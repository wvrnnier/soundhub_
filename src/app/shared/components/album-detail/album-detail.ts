import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MusicService } from '../../../core/services/music-service';
import { AudioService } from '../../../core/services/audio-service';

@Component({
  selector: 'app-album-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './album-detail.html',
  styleUrl: './album-detail.css',
})
export class AlbumDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private musicService = inject(MusicService);
  private audioService = inject(AudioService);
  album = signal<any>(null);
  tracks = signal<any[]>([]);

  // Para formato de duración
  formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes + ":" + (Number(seconds) < 10 ? '0' : '') + seconds;
  }

  // Para formato de año
  getYear(dateString: string): string {
    return new Date(dateString).getFullYear().toString();
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadAlbumDetails(Number(id));
      }
    });
  }

  loadAlbumDetails(id: number) {
    this.musicService.getAlbumDetails(id).subscribe(resp => {
      // El primer resultado es el álbum (wrapperType: collection)
      // Los siguientes son las canciones (wrapperType: track)
      const results = resp.results;

      if (results && results.length > 0) {
        this.album.set(results.filter((item: any) => item.wrapperType === 'collection')[0]);
        this.tracks.set(results.filter((item: any) => item.wrapperType === 'track'));
      }
    });
  }

  playAlbum() {
    const tracks = this.tracks();
    if (tracks.length > 0) {
      // Reproducir la primera canción y poner el resto en cola
      this.audioService.playTrack(tracks[0], tracks);
    }
  }

  playFromTrack(index: number) {
    const allTracks = this.tracks();
    // Reordenar o simplemente pasar la lista original pero empezando en 'index'
    // La AudioService.playTrack toma (track, queue), así que pasamos la canción clickada
    // y la cola completa (o la cola desde ahí, según prefieras comportamiento Spotify)
    // Comportamiento "Spotify": Queue es el contexto (álbum completo), pero arranca en esa canción.
    // AudioService ya maneja playTrack(track, queue), si la queue es todo el álbum, 'next' funcionará.
    if (allTracks[index]) {
      this.audioService.playTrack(allTracks[index], allTracks);
    }
  }
}
