import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Track } from '../../../core/services/music-service';
import { AudioService } from '../../../core/services/audio-service';

@Component({
  selector: 'app-track-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './track-card.html',
  styleUrls: ['./track-card.css'],
})
export class TrackCardComponent {
  @Input() track!: Track;
  @Input() list: Track[] = [];

  audioService = inject(AudioService);

  playPreview() {
    if (this.track.previewUrl) {
      this.audioService.playTrack(this.track, this.list);
    }
  }
}
