import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Track } from '../../../core/services/music-service';
import { RouterLink } from '@angular/router';
import { AudioService } from '../../../core/services/audio-service';

@Component({
  selector: 'app-track-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './track-card.html',
  styleUrls: ['./track-card.css'],
})
export class TrackCardComponent {
  track = input.required<Track>();
  private audioService = inject(AudioService);

  isPlaying = false;

  togglePlay(event: Event) {
    event.stopPropagation();

    if (this.isPlaying) {
      this.audioService.pause();
    } else {
      this.audioService.playTrack(this.track());
    }

    this.isPlaying = !this.isPlaying;
  }
}
