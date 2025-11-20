import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MusicService, Track } from '../../../core/services/music';
import { SearchStateService } from '../../../core/services/search-state';

@Component({
    selector: 'app-search-bar',
    standalone: true,
    templateUrl: './search-bar.html',
    styleUrl: './search-bar.css',
    imports: [FormsModule],
})
export class SearchBarComponent {
    searchTerm: string = '';
    showDropdown: boolean = false;
    searchResults: Track[] = [];
    highlightedIndex: number = -1;
    
    @Output() selectResult: EventEmitter<Track> = new EventEmitter<Track>();

    constructor(private music: MusicService, private searchState: SearchStateService) {}

    onSearch() {
        if (this.searchTerm.trim().length > 0) {
            this.searchResults = this.music.search(this.searchTerm);
            console.log('Search results:', this.searchResults);
            this.showDropdown = true;
            this.highlightedIndex = this.searchResults.length > 0 ? 0 : -1;
        } else {
            this.searchResults = [];
            this.showDropdown = false;
            this.highlightedIndex = -1;
        }
    }

    onSelectResult(result: Track) {
        this.searchTerm = result.title;
        this.showDropdown = false;
        this.selectResult.emit(result); // (optional, for other listeners)
        this.searchState.setSelectedTrack(result); // update shared state
    }

    onBlur() {
        setTimeout(() => this.showDropdown = false, 200);
    }

    onKeyDown(event: KeyboardEvent) {
    console.log('Key pressed:', event.key, 'Dropdown visible:', this.showDropdown, 'Results length:', this.searchResults.length);
    if (!this.showDropdown || this.searchResults.length === 0) {
        console.log('Returning early: dropdown not visible or no results');
        return;
    }

    if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.highlightedIndex = (this.highlightedIndex + 1) % this.searchResults.length;
        console.log('ArrowDown: highlightedIndex =', this.highlightedIndex);
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.highlightedIndex = (this.highlightedIndex - 1 + this.searchResults.length) % this.searchResults.length;
        console.log('ArrowUp: highlightedIndex =', this.highlightedIndex);
    } else if (event.key === 'Enter') {
        event.preventDefault();
        if (this.highlightedIndex >= 0 && this.highlightedIndex < this.searchResults.length) {
            console.log('Enter: selecting result at index', this.highlightedIndex);
            this.onSelectResult(this.searchResults[this.highlightedIndex]);
        }
    }
}
}