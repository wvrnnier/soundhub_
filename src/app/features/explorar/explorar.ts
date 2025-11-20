import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MusicService } from '../../core/services/music';
import { SearchStateService } from '../../core/services/search-state';

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './explorar.html',
  styleUrl: './explorar.css'
})
export class ExplorarComponent {
  constructor(
    public music: MusicService,
    public searchState: SearchStateService
  ) {}

  get selectedTrack() {
    return this.searchState.selectedTrack();
  }

  isFav(id: string) {
    return this.music.favs().includes(id);
  }

  toggle(id: string) {
    this.music.toggleFav(id);
  }
}