import { Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../../core/services/audio-service';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player.html',
  styleUrl: './player.css'
})

export class PlayerComponent {

  // Inyectamos el servicio
  public audioService = inject(AudioService);

  // Conectamos las variables del template con las señales del servicio
  get currentTrack() { return this.audioService.currentTrack(); }
  get isPlaying() { return this.audioService.isPlaying(); }
  get currentTime() { return this.audioService.currentTime(); }
  get duration() { return this.audioService.duration(); }
  get volume() { return this.audioService.volume(); }
  get isMuted() { return this.audioService.isMuted(); }

  // Los botones ahora llaman al servicio
  playPause() {
    this.audioService.togglePlay();
  }

  seek(event: any) {
    this.audioService.seek(event.target.value);
  }

  setVolume(event: any) {
    this.audioService.setVolume(event.target.value);
  }

  toggleMute() {
    this.audioService.toggleMute();
  }

  skip(direction: 'next' | 'prev') {
    if (direction === 'next') {
      this.audioService.next();
    } else {
      this.audioService.prev();
    }
  }

  getVolumenIcon(): string {
    if (this.isMuted || this.volume === 0) return 'volume_off';
    return 'volume_up';
  }

  formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }
}