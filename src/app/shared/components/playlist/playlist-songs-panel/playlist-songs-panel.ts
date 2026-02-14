import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';
import { PlaylistDetail, PlaylistSong } from '../../../../core/services/playlist-service';

@Component({
  selector: 'app-playlist-songs-panel',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  imports: [CommonModule],
  templateUrl: './playlist-songs-panel.html',
  styleUrl: './playlist-songs-panel.css',
})
export class PlaylistSongsPanelComponent {
  loadingPlaylist = input(false);
  selectedPlaylist = input<PlaylistDetail | null>(null);
  deletingPlaylist = input(false);
  renamingPlaylist = input(false);
  removingTrackIds = input<Set<string>>(new Set<string>());

  deleteRequested = output<void>();
  renameRequested = output<void>();
  playRequested = output<PlaylistSong>();
  removeRequested = output<PlaylistSong>();

  onRenamePlaylist(): void {
    this.renameRequested.emit();
  }

  onDeletePlaylist(): void {
    this.deleteRequested.emit();
  }

  onPlaySong(song: PlaylistSong): void {
    this.playRequested.emit(song);
  }

  onRemoveSong(song: PlaylistSong): void {
    this.removeRequested.emit(song);
  }

  isRemoving(trackId: string): boolean {
    return this.removingTrackIds().has(trackId);
  }
}
