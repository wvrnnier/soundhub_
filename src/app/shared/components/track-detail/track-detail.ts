import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MusicService, Track } from '../../../core/services/music-service';
import { AudioService } from '../../../core/services/audio-service';

@Component({
  selector: 'app-track-detail',
  standalone: true,
  templateUrl: './track-detail.html',
  styleUrls: ['./track-detail.css'],
})
export class TrackDetailComponent implements OnInit {
  music = inject(MusicService);
  route = inject(ActivatedRoute);
  audioService = inject(AudioService);

  track = signal<Track | null>(null);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.music.getTrackById(id).subscribe((track) => {
      this.track.set(track);
    });
  }

  play() {
    if (this.track()?.previewUrl) {
      this.audioService.play(this.track()!.previewUrl);
    }
  }
}
