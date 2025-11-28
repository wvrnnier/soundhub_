import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MusicService } from '../../../core/services/music-service';

@Component({
  selector: 'app-search-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search-list.html',
  styleUrls: ['./search-list.css'],
})
export class SearchBarComponent {
  music = inject(MusicService);
  query = signal('');

  onSearch() {
    if (this.query().trim().length === 0) return;
    this.music.searchSongs(this.query());
  }
}
