import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MusicService } from '../../../core/services/music-service';
import { TrackCardComponent } from '../track-card/track-card';

@Component({
  selector: 'app-tracks-list',
  standalone: true,
  imports: [TrackCardComponent],
  templateUrl: './track-list.html',
  styleUrls: ['./track-list.css'],
})
export class TracksListComponent implements OnInit {
  music = inject(MusicService);
  route = inject(ActivatedRoute);

  query = signal('');
  page = signal(0);

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.query.set(params['q'] ?? 'reggaeton');
      this.page.set(Number(params['page'] ?? 0));

      this.music.searchSongs(this.query(), 24, this.page() * 24);
    });
  }
}
