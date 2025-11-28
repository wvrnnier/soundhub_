import { Injectable, signal } from '@angular/core';
import { Track } from './music-service';

@Injectable({ providedIn: 'root' })
export class SearchStateService {
  selectedTrack = signal<Track | null>(null);

  setSelectedTrack(track: Track | null) {
    this.selectedTrack.set(track);
  }
}
