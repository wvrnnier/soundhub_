import { Component, OnInit, inject } from '@angular/core';
import { MusicService } from '../../../core/services/music-service';
import { ArtistCardComponent } from '../../../shared/components/artist-card/artist-card';

@Component({
  selector: 'app-artists-list',
  standalone: true,
  imports: [ArtistCardComponent],
  templateUrl: './artist-list.html',
  styleUrls: ['./artist-list.css'],
})
export class ArtistsListComponent implements OnInit {
  music = inject(MusicService);

  ngOnInit() {
    this.music.searchArtists('reggaeton');
  }
}
