import { Component, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { MusicService, Track } from '../../core/services/music';
@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './explorar.html',
  styleUrls: ['./explorar.css']
})
export class ExplorarComponent {
  termm = signal('');

  results = signal<Track[]>([]);

  constructor(public music: MusicService) {
    this.results.set(this.music.tracks());
  }
  oSearch(v: string) {
    this.termm.set(v);
    this.results.set(this.music.search(v));
  }

  isfav(id: string) { return this.music.favs().includes(id); }
  toggle(id: string){ this.music.toggleFav(id);}
}

