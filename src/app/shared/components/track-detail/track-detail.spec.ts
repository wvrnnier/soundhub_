import { Component, OnInit, inject } from '@angular/core';
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
  route = inject(ActivatedRoute);
  music = inject(MusicService);
  audioService = inject(AudioService); // 👈 Añadido

  track?: Track;

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.music.getTrackById(id).then((track) => {
      this.track = track;
    });
  }

  play() {
    if (this.track?.previewUrl) {
      this.audioService.play(this.track.previewUrl); // 👈 USAR AUDIO GLOBAL
    }
  }
}
