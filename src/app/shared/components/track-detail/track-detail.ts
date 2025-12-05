import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MusicService, Track } from '../../../core/services/music-service';
import { AudioService } from '../../../core/services/audio-service';
import { LyricsService } from '../../../core/services/lyrics-service';

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
  lyricsService = inject(LyricsService);
  lyrics = signal<string>('');

  track = signal<Track | null>(null);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.music.getTrackById(id).subscribe((track) => {
      this.track.set(track);

      if (track) {
        const durationSeconds = Math.round(track.trackTimeMillis / 1000);

        this.lyricsService.getLyrics(
          track.trackName,
          track.artistName,
          track.collectionName,
          durationSeconds
        ).subscribe({
          next: (data) => {
            this.lyrics.set(data.plainLyrics || 'Letra no encontrada');
          },
          error: (err) => {
            console.error('Error fetching lyrics:', err);
            this.lyrics.set('No se pudo cargar la letra.');
          }
        });
      }
    });
  }

  play() {
    if (this.track()?.previewUrl) {
      this.audioService.playTrack(this.track()!);
    }
  }
}
