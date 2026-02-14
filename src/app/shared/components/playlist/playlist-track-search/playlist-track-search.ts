import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { Track } from '../../../../core/services/music-service';
import { PlaylistDetail, PlaylistService } from '../../../../core/services/playlist-service';

@Component({
  selector: 'app-playlist-track-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './playlist-track-search.html',
  styleUrl: './playlist-track-search.css',
})
export class PlaylistTrackSearchComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly playlistService = inject(PlaylistService);

  selectedPlaylist = input<PlaylistDetail | null>(null);
  addingTrackIds = input<Set<string>>(new Set<string>());
  trackSelected = output<Track>();

  readonly searchForm = this.fb.nonNullable.group({
    query: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
  });

  searchResults = signal<Track[]>([]);
  searchingTracks = signal(false);
  searchError = signal<string | null>(null);
  hasTypedQuery = computed(() => this.searchForm.controls.query.value.trim().length >= 1);

  constructor() {
    effect(() => {
      const playlist = this.selectedPlaylist();
      if (!playlist) {
        this.searchForm.reset({ query: '' }, { emitEvent: false });
        this.searchResults.set([]);
        this.searchError.set(null);
        this.searchingTracks.set(false);
        return;
      }

      this.searchResults.update((tracks) => this.filterExistingTracks(tracks, playlist));

      const currentQuery = this.searchForm.controls.query.value.trim();
      if (currentQuery.length >= 1) {
        this.executeSearch(currentQuery).subscribe((tracks) => this.applySearchResult(tracks));
      }
    });
  }

  ngOnInit(): void {
    this.setupReactiveSearch();
  }

  searchTracksToAdd(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const query = this.searchForm.controls.query.value.trim();
    this.executeSearch(query).subscribe((tracks) => this.applySearchResult(tracks));
  }

  onTrackSelected(track: Track): void {
    this.trackSelected.emit(track);
    this.searchResults.update((results) =>
      results.filter((result) => result.id !== track.id),
    );
  }

  isAdding(trackId: string): boolean {
    return this.addingTrackIds().has(trackId);
  }

  private setupReactiveSearch(): void {
    this.searchForm.controls.query.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((query) => query.trim()),
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((query) => this.executeSearch(query)),
      )
      .subscribe((tracks) => this.applySearchResult(tracks));
  }

  private executeSearch(query: string): Observable<Track[] | null> {
    const selectedPlaylist = this.selectedPlaylist();
    if (!selectedPlaylist || query.length < 1) {
      this.searchError.set(null);
      this.searchResults.set([]);
      this.searchingTracks.set(false);
      return of(null);
    }

    this.searchingTracks.set(true);
    this.searchError.set(null);

    return this.playlistService.searchTracks(query).pipe(
      map((tracks) => this.filterExistingTracks(tracks, selectedPlaylist)),
      catchError((error) => {
        this.searchError.set(this.resolveSearchError(error, 'No se pudieron buscar canciones'));
        return of([] as Track[]);
      }),
    );
  }

  private applySearchResult(tracks: Track[] | null): void {
    if (tracks === null) return;
    this.searchResults.set(tracks);
    this.searchingTracks.set(false);
  }

  private filterExistingTracks(tracks: Track[], selectedPlaylist: PlaylistDetail): Track[] {
    const existingIds = new Set(selectedPlaylist.songs.map((song) => song.trackId));
    return tracks.filter((track) => !existingIds.has(track.id));
  }

  private resolveSearchError(error: unknown, fallbackMessage: string): string {
    const httpError = error as HttpErrorResponse;
    return httpError?.error?.error ?? httpError?.error?.message ?? fallbackMessage;
  }
}
