import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AudioService } from '../../../../core/services/audio-service';
import { AuthService } from '../../../../core/services/auth.service';
import { Track } from '../../../../core/services/music-service';
import { PlaylistSidebarComponent } from '../playlist-sidebar/playlist-sidebar';
import { PlaylistSongsPanelComponent } from '../playlist-songs-panel/playlist-songs-panel';
import { PlaylistTrackSearchComponent } from '../playlist-track-search/playlist-track-search';
import {
  PlaylistDetail,
  PlaylistService,
  PlaylistSong,
  PlaylistSummary,
} from '../../../../core/services/playlist-service';

@Component({
  selector: 'app-play-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PlaylistTrackSearchComponent,
    PlaylistSidebarComponent,
    PlaylistSongsPanelComponent,
  ],
  templateUrl: './play-list.html',
  styleUrl: './play-list.css',
})
export class PlayList implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly playlistService = inject(PlaylistService);
  private readonly audioService = inject(AudioService);

  readonly playlists = computed(() => this.playlistService.playlists());
  readonly username = signal('');

  readonly createListForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
  });

  readonly isLoggedIn = signal(false);
  readonly loadingPlaylist = signal(false);
  readonly creatingPlaylist = signal(false);
  readonly deletingPlaylist = signal(false);
  readonly addingTrackId = signal<Set<string>>(new Set());
  readonly removingTrackId = signal<Set<string>>(new Set());
  readonly toastMessage = signal<string | null>(null);
  readonly toastType = signal<'success' | 'error'>('success');
  readonly selectedPlaylist = signal<PlaylistDetail | null>(null);
  readonly confirmDeletePlaylist = signal<PlaylistDetail | null>(null);

  private routePlaylistId: number | null = null;
  private readonly toastDurationMs = 2800;
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const idParam = params.get('id');
      const parsedId = idParam ? Number(idParam) : null;
      this.routePlaylistId =
        parsedId && Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;

      this.trySyncPlaylistSelection(this.playlists());
    });

    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      this.isLoggedIn.set(!!user);
      this.username.set(user?.username ?? '');
      this.clearFeedback();

      if (user) {
        this.loadPlaylists();
      } else {
        this.playlistService.clearState();
        this.selectedPlaylist.set(null);
      }
    });
  }

  loadPlaylists(): void {
    this.playlistService.loadPlaylists().subscribe({
      next: (playlists) => {
        this.trySyncPlaylistSelection(playlists);
        this.loadSidebarLibrarySongs();
      },
      error: (error) => {
        this.handleHttpError(error, 'No se pudieron cargar tus listas');
      },
    });
  }

  createPlaylist(): void {
    if (this.createListForm.invalid) {
      this.createListForm.markAllAsTouched();
      return;
    }

    const name = this.createListForm.controls.name.value.trim();
    if (!name) return;

    this.clearFeedback();
    this.creatingPlaylist.set(true);

    this.playlistService.createPlaylist(name).subscribe({
      next: (playlist) => {
        this.creatingPlaylist.set(false);
        this.createListForm.reset({ name: '' });
        this.showSuccess('Lista creada');
        this.openPlaylist(playlist.id);
      },
      error: (error) => {
        this.creatingPlaylist.set(false);
        this.handleHttpError(error, 'No se pudo crear la lista');
      },
    });
  }

  openPlaylist(playlistId: number): void {
    this.router.navigate(['/playlist', playlistId]);
  }

  deleteCurrentPlaylist(): void {
    const playlist = this.selectedPlaylist();
    if (!playlist) return;
    this.confirmDeletePlaylist.set(playlist);
  }

  confirmDelete(): void {
    const playlist = this.confirmDeletePlaylist();
    if (!playlist) return;

    this.clearFeedback();
    this.deletingPlaylist.set(true);

    this.playlistService.deletePlaylist(playlist.id).subscribe({
      next: () => {
        this.deletingPlaylist.set(false);
        this.confirmDeletePlaylist.set(null);
        this.selectedPlaylist.set(null);
        this.showSuccess('Lista eliminada');
        this.loadPlaylists();
      },
      error: (error) => {
        this.deletingPlaylist.set(false);
        this.confirmDeletePlaylist.set(null);
        this.handleHttpError(error, 'No se pudo borrar la lista');
      },
    });
  }

  cancelDelete(): void {
    this.confirmDeletePlaylist.set(null);
  }

  addTrack(track: Track): void {
    const playlist = this.selectedPlaylist();
    if (!playlist) return;

    this.clearFeedback();
    this.addingTrackId.update((ids) => new Set(ids).add(track.id));

    this.playlistService.addSongToPlaylist(playlist.id, track).subscribe({
      next: () => {
        this.addingTrackId.update((ids) => {
          const next = new Set(ids);
          next.delete(track.id);
          return next;
        });
        this.showSuccess('Cancion agregada');
        this.loadPlaylist(playlist.id, false);
        this.loadSidebarLibrarySongs();
      },
      error: (error) => {
        this.addingTrackId.update((ids) => {
          const next = new Set(ids);
          next.delete(track.id);
          return next;
        });
        this.handleHttpError(error, 'No se pudo anadir la cancion');
      },
    });
  }

  removeTrack(song: PlaylistSong): void {
    const playlist = this.selectedPlaylist();
    if (!playlist) return;

    this.clearFeedback();
    this.removingTrackId.update((ids) => new Set(ids).add(song.trackId));

    this.playlistService.removeSongFromPlaylist(playlist.id, song.trackId).subscribe({
      next: () => {
        this.removingTrackId.update((ids) => {
          const next = new Set(ids);
          next.delete(song.trackId);
          return next;
        });
        this.showSuccess('Cancion eliminada de la lista');
        this.loadPlaylist(playlist.id, false);
        this.loadSidebarLibrarySongs();
      },
      error: (error) => {
        this.removingTrackId.update((ids) => {
          const next = new Set(ids);
          next.delete(song.trackId);
          return next;
        });
        this.handleHttpError(error, 'No se pudo eliminar la cancion');
      },
    });
  }

  playSong(song: PlaylistSong): void {
    if (!song.previewUrl) {
      this.showError('Esta cancion no tiene preview disponible para reproducir');
      return;
    }

    const playlist = this.selectedPlaylist();
    const queue = (playlist?.songs ?? [])
      .filter((playlistSong) => !!playlistSong.previewUrl)
      .map((playlistSong) => this.toTrack(playlistSong));

    this.audioService.playTrack(this.toTrack(song), queue);
  }

  private loadPlaylist(playlistId: number, showLoader = true): void {
    if (showLoader) {
      this.loadingPlaylist.set(true);
    }

    this.playlistService.loadPlaylist(playlistId).subscribe({
      next: (playlist) => {
        this.selectedPlaylist.set(playlist);
        this.loadingPlaylist.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loadingPlaylist.set(false);
        if (error.status === 404) {
          this.loadPlaylists();
          return;
        }
        this.handleHttpError(error, 'No se pudo cargar la lista');
      },
    });
  }

  private trySyncPlaylistSelection(playlists: PlaylistSummary[]): void {
    if (playlists.length === 0) {
      this.selectedPlaylist.set(null);
      if (this.router.url !== '/playlist') {
        this.router.navigate(['/playlist']);
      }
      return;
    }

    const routePlaylistExists =
      this.routePlaylistId !== null &&
      playlists.some((playlist) => playlist.id === this.routePlaylistId);

    let targetPlaylistId: number;

    if (routePlaylistExists && this.routePlaylistId !== null) {
      targetPlaylistId = this.routePlaylistId;
    } else {
      const currentPlaylistId = this.selectedPlaylist()?.id;
      const currentStillExists = playlists.some(
        (playlist) => playlist.id === currentPlaylistId,
      );
      targetPlaylistId = currentStillExists && currentPlaylistId
        ? currentPlaylistId
        : playlists[0].id;
    }

    if (this.routePlaylistId !== targetPlaylistId) {
      this.router.navigate(['/playlist', targetPlaylistId]);
      return;
    }

    if (this.selectedPlaylist()?.id !== targetPlaylistId) {
      this.loadPlaylist(targetPlaylistId);
    }
  }

  private loadSidebarLibrarySongs(): void {
    this.playlistService.loadLibrarySongs().subscribe({
      error: () => {
        // La vista principal no se bloquea si falla esta carga secundaria.
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

  private clearFeedback(): void {
    this.toastMessage.set(null);
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
      this.toastTimeoutId = null;
    }
  }

  private handleHttpError(error: unknown, fallbackMessage: string): void {
    const httpError = error as HttpErrorResponse;
    const message = httpError?.error?.error ?? httpError?.error?.message ?? fallbackMessage;
    this.showError(message);
  }

  private showSuccess(message: string): void {
    this.showToast(message, 'success');
  }

  private showError(message: string): void {
    this.showToast(message, 'error');
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.clearFeedback();
    this.toastType.set(type);
    this.toastMessage.set(message);
    this.toastTimeoutId = setTimeout(() => {
      this.toastMessage.set(null);
      this.toastTimeoutId = null;
    }, this.toastDurationMs);
  }
}
