import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PlaylistSummary } from '../../../../core/services/playlist-service';

@Component({
  selector: 'app-playlist-sidebar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './playlist-sidebar.html',
  styleUrl: './playlist-sidebar.css',
})
export class PlaylistSidebarComponent {
  createListForm = input.required<FormGroup>();
  creatingPlaylist = input(false);
  playlists = input<PlaylistSummary[]>([]);
  selectedPlaylistId = input<number | null>(null);

  createRequested = output<void>();
  playlistSelected = output<number>();

  onCreatePlaylist(): void {
    this.createRequested.emit();
  }

  onOpenPlaylist(playlistId: number): void {
    this.playlistSelected.emit(playlistId);
  }
}
