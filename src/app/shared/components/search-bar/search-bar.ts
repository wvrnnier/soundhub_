import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ElementRef,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { MusicService, Track } from '../../../core/services/music-service';
import { SearchStateService } from '../../../core/services/search-state';

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
  searchResults: Track[] = [];
  highlightedIndex: number = -1;

  @Output() selectResult: EventEmitter<Track> = new EventEmitter<Track>();

  constructor(
    private music: MusicService,
    private searchState: SearchStateService,
    private el: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    effect(() => {
      this.searchResults = this.music.tracks();
      console.log('Search results:', this.searchResults);
      if (this.searchResults.length > 0) {
        this.showDropdown = true;
        this.highlightedIndex = 0;
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('click', this.onExitClick.bind(this));
      console.log('Añadido listener de click al documento');
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('click', this.onExitClick.bind(this));
      console.log('Eliminado listener de click del documento');
    }
  }

  onSearch() {
    if (this.searchTerm.trim().length > 0) {
      this.music.searchSongs(this.searchTerm);
    } else {
      this.searchResults = [];
      this.showDropdown = false;
      this.highlightedIndex = -1;
    }
  }

  onSelectResult(result: Track) {
    this.searchTerm = result.trackName;
    this.showDropdown = false;
    this.selectResult.emit(result);
    this.searchState.setSelectedTrack(result);
  }

  onBlur() {
    setTimeout(() => {
      this.showDropdown = false;
      this.cdr.detectChanges();
    }, 200);
  }

  onKeyDown(event: KeyboardEvent) {
    console.log(
      'Key pressed:',
      event.key,
      'Dropdown visible:',
      this.showDropdown,
      'Results length:',
      this.searchResults.length
    );
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
      this.highlightedIndex =
        (this.highlightedIndex - 1 + this.searchResults.length) % this.searchResults.length;
      console.log('ArrowUp: índice =', this.highlightedIndex);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.highlightedIndex >= 0 && this.highlightedIndex < this.searchResults.length) {
        console.log('Enter: resultado selecionado ', this.highlightedIndex);
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
      this.cdr.detectChanges(); // Force UI update
    } else {
      console.log('Click dentro del componente, no hacer nada');
    }
  }
}
