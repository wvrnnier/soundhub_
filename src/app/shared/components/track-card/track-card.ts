import { Component, input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Track } from '../../../core/services/music-service';
import { RouterLink } from '@angular/router';
import { AudioService } from '../../../core/services/audio-service';
import { PlaylistService } from '../../../core/services/playlist-service';

@Component({
  selector: 'app-track-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './track-card.html',
  styleUrls: ['./track-card.css'],
})
export class TrackCardComponent {
  track = input.required<Track>();
  private audioService = inject(AudioService);
  playlistService = inject(PlaylistService);
  showPlaylistMenu = false;

  isPlaying = false;

  togglePlay(event: Event) {
    event.stopPropagation();

    if (this.isPlaying) {
      this.audioService.pause();
    } else {
      this.audioService.playTrack(this.track());
    }

    this.isPlaying = !this.isPlaying;
  }

  togglePlaylistMenu(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.showPlaylistMenu = !this.showPlaylistMenu;
  }
  addToPlaylist(event: Event, playlistId: number) {
    event.stopPropagation();
    const track = this.track();

    this.playlistService.addSongToPlaylist(playlistId, track).subscribe(() => {
      this.showPlaylistMenu = false;
    });
  }
  isSongInPlaylist(playlistId: number): boolean {
    return this.playlistService.librarySongs().some(
      s => s.playlistId === playlistId && s.trackId === this.track().id
    );
  }
}
