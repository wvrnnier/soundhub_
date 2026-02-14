import {
  Component,
  computed,
  HostBinding,
  inject,
  OnDestroy,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AudioService } from '../../../core/services/audio-service';
import { AuthService, User } from '../../../core/services/auth.service';
import { Track } from '../../../core/services/music-service';
import { PlaylistService, PlaylistSong } from '../../../core/services/playlist-service';

@Component({
  selector: 'app-side-bar',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  templateUrl: './side-bar.html',
  styleUrls: ['./side-bar.css'],
  imports: [RouterLink, CommonModule],
})
export class SideBarComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly playlistService = inject(PlaylistService);
  private readonly audioService = inject(AudioService);

  private authSubscription?: Subscription;

  expanded = false;
  isSearchMenuOpen = false;
  isLibraryMenuOpen = false;
  isLoggedIn = false;
  currentUser: User | null = null;
  loadingPlaylistId: number | null = null;
  currentPlayingPlaylistId: number | null = null;
  private currentPlayingTrackIds = new Set<string>();

  playlists = computed(() => this.playlistService.playlists());
  playlistsForView = computed(() => [...this.playlists()].reverse());
  librarySongs = computed(() => this.playlistService.librarySongs());

  ngOnInit(): void {
    this.authSubscription = this.authService.currentUser$.subscribe((user) => {
      this.isLoggedIn = !!user;
      this.currentUser = user;
      if (this.isLoggedIn) {
        this.refreshLibraryData();
      } else {
        this.playlistService.clearState();
      }
    });
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  onMouseEnter() {
    this.expanded = true;
  }

  onMouseLeave() {
    this.expanded = false;
    this.isSearchMenuOpen = false;
    this.isLibraryMenuOpen = false;
  }

  onMouseEnterSearch() {
    this.isSearchMenuOpen = true;
  }

  onMouseLeaveSearch() {
    this.isSearchMenuOpen = false;
  }

  onMouseEnterLibrary() {
    this.isLibraryMenuOpen = true;
    if (this.isLoggedIn && this.playlists().length === 0) {
      this.refreshLibraryData();
    }
  }

  onMouseLeaveLibrary() {
    this.isLibraryMenuOpen = false;
  }

  goToPlaylistHome(event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/playlist']);
  }

  openPlaylist(playlistId: number, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/playlist', playlistId]);
  }

  playPlaylist(playlistId: number, event: Event): void {
    event.stopPropagation();
    if (this.loadingPlaylistId === playlistId) return;

    this.loadingPlaylistId = playlistId;

    this.playlistService.loadPlaylist(playlistId).subscribe({
      next: (playlist) => {
        const queue = playlist.songs
          .filter((song) => !!song.previewUrl)
          .map((song) => this.toTrack(song));

        if (queue.length > 0) {
          this.currentPlayingPlaylistId = playlistId;
          this.currentPlayingTrackIds = new Set(queue.map((track) => track.id));
          this.audioService.playTrack(queue[0], queue);
        }

        this.loadingPlaylistId = null;
      },
      error: () => {
        this.loadingPlaylistId = null;
      },
    });
  }

  isPlaylistPlaying(playlistId: number): boolean {
    const currentTrackId = this.audioService.currentTrack()?.id;
    if (!currentTrackId) return false;

    return (
      this.currentPlayingPlaylistId === playlistId &&
      this.audioService.isPlaying() &&
      this.currentPlayingTrackIds.has(currentTrackId)
    );
  }

  getPlaylistCover(playlistId: number): string | null {
    const song = this.librarySongs().find(
      (librarySong) => librarySong.playlistId === playlistId && !!librarySong.cover,
    );
    return song?.cover ?? null;
  }

  playFromLibrary(song: PlaylistSong, event: Event): void {
    event.stopPropagation();
    if (!song.previewUrl) return;

    this.currentPlayingPlaylistId = null;
    this.currentPlayingTrackIds = new Set<string>();

    const queue = this.librarySongs()
      .filter((librarySong) => !!librarySong.previewUrl)
      .map((librarySong) => this.toTrack(librarySong));

    this.audioService.playTrack(this.toTrack(song), queue);
  }

  @HostBinding('class.expanded')
  get isExpanded() {
    return this.expanded;
  }

  private refreshLibraryData(): void {
    this.playlistService.loadPlaylists().subscribe({
      error: () => {
        // Sidebar no bloquea la UI principal en errores de sincronizacion.
      },
    });

    this.playlistService.loadLibrarySongs().subscribe({
      error: () => {
        // Sidebar no bloquea la UI principal en errores de sincronizacion.
      },
    });
  }

  private toTrack(song: PlaylistSong): Track {
    return {
      id: song.trackId,
      title: song.title,
      artist: song.artist,
      cover: song.cover,
      previewUrl: song.previewUrl ?? undefined,
      album: song.album ?? undefined,
      duration: song.duration ?? undefined,
      genre: song.genre ?? undefined,
    };
  }
}
