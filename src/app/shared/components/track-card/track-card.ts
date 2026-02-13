import { Component, input, inject, signal, HostListener } from '@angular/core';
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
  private static activeCard: TrackCardComponent | null = null;

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

    if (TrackCardComponent.activeCard && TrackCardComponent.activeCard !== this) {
      TrackCardComponent.activeCard.showPlaylistMenu = false;
    }

    this.showPlaylistMenu = !this.showPlaylistMenu;
    if (this.showPlaylistMenu) {
      TrackCardComponent.activeCard = this;
    } else {
      TrackCardComponent.activeCard = null;
    }
  }

  @HostListener('document:click')
  closeMenu() {
    if (this.showPlaylistMenu) {
      this.showPlaylistMenu = false;
      if (TrackCardComponent.activeCard === this) {
        TrackCardComponent.activeCard = null;
      }
    }
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
