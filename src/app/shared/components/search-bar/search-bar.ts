import { Component, Output, EventEmitter, OnInit, OnDestroy, ElementRef, Inject, PLATFORM_ID, ChangeDetectorRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { MusicService, Track, Album } from '../../../core/services/music-service';
import { SearchStateService } from '../../../core/services/search-state';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.css',
  imports: [FormsModule],
})
export class SearchBarComponent implements OnInit, OnDestroy {
  searchTerm: string = '';
  showDropdown: boolean = false;
  searchResults: (Track | Album)[] = [];
  highlightedIndex: number = -1;

  @Output() selectResult: EventEmitter<Track> = new EventEmitter<Track>();
  private router = inject(Router);

  private searchSubject = new Subject<string>();

  constructor(
    private music: MusicService,
    private searchState: SearchStateService,
    private el: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('click', this.onExitClick.bind(this));
      console.log('Añadido listener de click al documento');
      // Configurar búsqueda reactiva
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (term.trim().length > 0) {
            return this.music.searchTracks(term, 24);
          } else {
            return of({ results: [] });
          }
        })
      ).subscribe({
        next: (response: any) => {
          const songs = response.results || [];
          const term = this.searchTerm.trim().toLowerCase();

          if (term.length > 0) {
            this.music.searchAlbums(this.searchTerm, 16).subscribe(albumResponse => {
              const albums = albumResponse.results || [];

              // 1. MEZCLAMOS
              let mixedResults = [...songs, ...albums];

              // 2. ORDENAMOS POR RELEVANCIA
              mixedResults.sort((a, b) => {
                const titleA = a.title.toLowerCase();
                const titleB = b.title.toLowerCase();

                // Prioridad 1: Coincidencia EXACTA
                if (titleA === term && titleB !== term) return -1;
                if (titleB === term && titleA !== term) return 1;

                // Prioridad 2: Empieza con el término
                const aStarts = titleA.startsWith(term);
                const bStarts = titleB.startsWith(term);

                if (aStarts && !bStarts) return -1;
                if (bStarts && !aStarts) return 1;

                // Por defecto: orden alfabético si ambos tienen la misma prioridad
                return 0;
              });
              this.searchResults = mixedResults;

              this.showDropdown = this.searchResults.length > 0;
              this.highlightedIndex = this.searchResults.length > 0 ? 0 : -1;
              this.cdr.detectChanges();
            });
          } else {
            this.searchResults = [];
            this.showDropdown = false;
          }
        },
        error: (err) => {
          console.error('Error al buscar:', err);
          this.searchResults = [];
          this.cdr.detectChanges();
        }
      });
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('click', this.onExitClick.bind(this));
      console.log('Eliminado listener de click del documento');
      this.searchSubject.complete();
    }
  }

  onSearch() {
    this.searchSubject.next(this.searchTerm);
    if (this.searchTerm.trim().length === 0) {
      this.music.clearSearch();
      this.searchResults = [];
      this.showDropdown = false;
      this.highlightedIndex = -1;
    }
  }

  isAlbum(result: Track | Album): boolean {
    return 'trackCount' in result;
  }


  onSelectResult(result: Track | Album) {
    this.searchTerm = result.title;
    this.showDropdown = false;

    if ('trackCount' in result) {
      // Es un álbum
      this.router.navigate(['/albumDetail', result.id]);
    } else {
      // Es una canción
      this.selectResult.emit(result as Track);
      this.searchState.setSelectedTrack(result as Track);
      this.router.navigate(['/trackDetail', result.id]);
    }
  }



  onBlur() {
    setTimeout(() => {
      this.showDropdown = false;
      this.cdr.detectChanges();
    }, 200);
  }

  onKeyDown(event: KeyboardEvent) {
    console.log('Key pressed:', event.key, 'Dropdown visible:', this.showDropdown, 'Results length:', this.searchResults.length);
    if (this.searchResults.length === 0 && event.key !== 'Escape') {
      console.log('Sin resultados y no es escape');
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlightedIndex = (this.highlightedIndex + 1) % this.searchResults.length;
      console.log('ArrowDown: índice =', this.highlightedIndex);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightedIndex = (this.highlightedIndex - 1 + this.searchResults.length) % this.searchResults.length;
      console.log('ArrowUp: índice =', this.highlightedIndex);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.highlightedIndex >= 0 && this.highlightedIndex < this.searchResults.length) {
        console.log('Enter: resultado seleccionado ', this.highlightedIndex);
        this.onSelectResult(this.searchResults[this.highlightedIndex]);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      console.log('Escape: cerrando dropdown');
      this.showDropdown = false;
      this.cdr.detectChanges();
    }
  }

  onExitClick(event: MouseEvent) {
    console.log('Detectado click en:', event.target);
    if (event.target instanceof Element && !this.el.nativeElement.contains(event.target)) {
      console.log('Click fuera del componente, cerrando dropdown');
      this.showDropdown = false;
      this.cdr.detectChanges();
    } else {
      console.log('Click dentro del componente, no hacer nada');
    }
  }
}
