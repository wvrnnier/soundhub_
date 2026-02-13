import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MusicService } from '../../../core/services/music-service';
import { AudioService } from '../../../core/services/audio-service';
import { PlaylistService } from '../../../core/services/playlist-service';

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
  public audioService = inject(AudioService);
  private playlistService = inject(PlaylistService);
  album = signal<any>(null);
  tracks = signal<any[]>([]);

  // Para formato de duración
  formatDuration(ms: number): string {
    if (!ms) return '0:00';
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
      const type = this.route.snapshot.data['type'];
      if (id) {
        if (type === 'playlist') {
          this.loadPlaylistDetails(Number(id));
        } else {
          this.loadAlbumDetails(id);
        }
      }
    });
  }

  loadAlbumDetails(id: string) {
    this.musicService.getAlbumWithTracks(id).subscribe(resp => {
      this.album.set(resp.album);
      this.tracks.set(resp.tracks);
    });
  }

  loadPlaylistDetails(id: number) {
    this.playlistService.loadPlaylist(id).subscribe(details => {
      this.album.set({
        id: details.id,
        title: details.listName,
        artist: 'Tu Lista',
        releaseDate: details.createdAt,
        trackCount: details.songCount,
        cover: details.songs.length > 0
          ? details.songs[0].cover
          : 'https://misc.scdn.co/liked-songs/liked-songs-300.png'
      });

      this.tracks.set(details.songs.map(s => ({
        id: s.trackId,
        title: s.title,
        artist: s.artist,
        album: s.album,
        cover: s.cover,
        duration: s.duration,
        url: s.previewUrl
      })));
    });
  }

  isPlaylist(): boolean {
    return this.route.snapshot.data['type'] === 'playlist';
  }

  isAlbumPlaying(): boolean {
    const currentTrack = this.audioService.currentTrack();
    if (!currentTrack || !this.tracks().length) return false;
    // Comprobar si la canción actual pertenece a este álbum (puedes usar ID o comparar listas)
    // Una forma simple es ver si el ID de la canción actual está en la lista de tracks de este álbum
    return this.audioService.isPlaying() && this.tracks().some(t => t.id === currentTrack.id);
  }

  playAlbum() {
    const tracks = this.tracks();
    if (tracks.length > 0) {
      if (this.isAlbumPlaying()) {
        this.audioService.pause();
      } else {
        // Si ya hay una canción de este álbum cargada pero pausada, reanudar
        const currentTrack = this.audioService.currentTrack();
        if (currentTrack && tracks.some(t => t.id === currentTrack.id)) {
          this.audioService.play();
        } else {
          // Si no, empezar desde el principio
          this.audioService.playTrack(tracks[0], tracks);
        }
      }
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
