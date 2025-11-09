import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
    searchResults: string[] = [];
    
    @Output() search: EventEmitter<string> = new EventEmitter<string>();
    @Output() selectResult: EventEmitter<string> = new EventEmitter<string>();

    allSongs: string[] = [
        'Bohemian Rhapsody - Queen',
        'Stairway to Heaven - Led Zeppelin',
        'Hotel California - Eagles',
        'Imagine - John Lennon',
        'Smells Like Teen Spirit - Nirvana'
    ];

    onSearch() {
        if (this.searchTerm.trim().length > 0) {
            this.searchResults = this.allSongs.filter(song => 
                song.toLowerCase().includes(this.searchTerm.toLowerCase())
            );
            this.showDropdown = true;
        } else {
            this.searchResults = [];
            this.showDropdown = false;
        }
        this.search.emit(this.searchTerm);
    }

    onSelectResult(result: string) {
        this.searchTerm = result;
        this.showDropdown = false;
        this.selectResult.emit(result);
    }

    onBlur() {
        setTimeout(() => this.showDropdown = false, 200);
    }
}