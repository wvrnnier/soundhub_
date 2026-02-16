import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MusicService, Track } from '../../../core/services/music-service';
import { AudioService } from '../../../core/services/audio-service';
import { LyricsService } from '../../../core/services/lyrics-service';
import { PlaylistService } from '../../../core/services/playlist-service';

@Component({
  selector: 'app-track-detail',
  standalone: true,
  imports: [RouterLink],
  styleUrls: ['./track-detail.css'],
  templateUrl: './track-detail.html',
})
export class TrackDetailComponent implements OnInit {
  music = inject(MusicService);
  route = inject(ActivatedRoute);
  audioService = inject(AudioService);
  lyricsService = inject(LyricsService);
  lyrics = signal<string>('');
  playlistService = inject(PlaylistService);
  showPlaylistMenu = signal(false);

  track = signal<Track | null>(null);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadTrack(id);
      }
    });
  }

  loadTrack(id: string) {
    this.music.getTrackById(id).subscribe((track) => {
      this.track.set(track);

      if (track) {
        const durationSeconds = Math.round((track.duration || 0) / 1000);

        this.lyricsService.getLyrics(
          track.title,
          track.artist,
          track.album || '',
          durationSeconds
        ).subscribe({
          next: (data) => {
            this.lyrics.set(data.plainLyrics || 'Letra no encontrada');
          },
          error: (err) => {
            console.error('Error fetching lyrics:', err);
            this.lyrics.set('No se pudo cargar la letra.');
          }
        });
      }
    });
  }

  play() {
    const track = this.track();
    if (!track?.previewUrl) return;

    if (this.audioService.currentTrack()?.id === track.id) {
      this.audioService.togglePlay();
    } else {
      this.audioService.playTrack(track);
    }
  }

  togglePlaylistMenu(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showPlaylistMenu.update(v => !v);
  }

  @HostListener('document:click')
  closeMenu() {
    if (this.showPlaylistMenu()) {
      this.showPlaylistMenu.set(false);
    }
  }

  addToPlaylist(playlistId: number) {
    const track = this.track();
    if (!track) return;
    this.playlistService.addSongToPlaylist(playlistId, track).subscribe(() => {
      this.showPlaylistMenu.set(false);
    });
  }

  isSongInPlaylist(playlistId: number): boolean {
    const trackId = this.track()?.id;
    if (!trackId) return false;
    return this.playlistService.librarySongs().some(
      song => song.playlistId === playlistId && song.trackId === trackId
    )
  }
}