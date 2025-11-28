import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface Track {
  source: string; // URL del archivo de audio
  title: string;
  artist: string;
  cover: string; // URL de la imagen de portada
}

@Component({
  selector: 'app-player',
  standalone: true,
  templateUrl: './player.html',
  styleUrl: './player.css'
})
export class PlayerComponent implements OnInit, AfterViewInit {
  @ViewChild('audioElement') audio!: ElementRef<HTMLAudioElement>;

  public tracks: Track[] = [
    { title: 'Creep', artist: 'Radiohead', cover: 'assets/covers/creep.jpg', source: 'assets/audio/Creep.mp3' },
  ];

  public currentTrackIndex: number = 0;
  public currentTrack: Track = this.tracks[this.currentTrackIndex];
  public isPlaying: boolean = false;
  public currentTime: number = 0;
  public duration: number = 0;
  public volume: number = 1;
  public isMuted: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Establecer la fuente inicial
      this.audio.nativeElement.src = this.currentTrack.source;
      this.audio.nativeElement.load();
    }
  }
  // Controles de reproducción

  playPause(): void {
    if (isPlatformBrowser(this.platformId)) {
      const audioEl = this.audio.nativeElement;
      if (this.isPlaying) {
        audioEl.pause();
      } else {
        audioEl.play().catch(error => {
          console.error("Error al reproducir el audio:", error);
          // Manejar errores de reproducción automática (p. ej., por políticas del navegador)
        });
      }
      this.isPlaying = !this.isPlaying;
    }
  }

  skip(direction: 'next' | 'prev'): void {
    if (isPlatformBrowser(this.platformId)) {
      if (direction === 'next') {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
      } else {
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
      }

      this.currentTrack = this.tracks[this.currentTrackIndex];
      this.audio.nativeElement.src = this.currentTrack.source;

      // Si estaba reproduciendo, reanuda automáticamente la nueva canción
      if (this.isPlaying) {
        this.audio.nativeElement.play();
      }
    }
  }

  seek(event: any): void {
    if (isPlatformBrowser(this.platformId)) {
      const time = event.target.value;
      this.audio.nativeElement.currentTime = time;
    }
  }
  // Controles de volumen

  setVolume(event: any): void {
    if (isPlatformBrowser(this.platformId)) {
      // 1. Guardamos el valor en la variable de la clase (importante)
      this.volume = parseFloat(event.target.value);
      this.audio.nativeElement.volume = this.volume;

      // 2. Si el volumen es 0, forzamos el estado de "mute"
      if (this.volume === 0) {
        this.isMuted = true;
        this.audio.nativeElement.muted = true;
      } else {
        // Si subimos el volumen, quitamos el mute
        this.isMuted = false;
        this.audio.nativeElement.muted = false;
      }
    }
  }

  toggleMute(): void {
    if (isPlatformBrowser(this.platformId)) {
      const audioEl = this.audio.nativeElement;
      audioEl.muted = !audioEl.muted;
      this.isMuted = audioEl.muted;
    }
  }

  getVolumenIcon(): string {
    if (this.isMuted || this.volume === 0) {
      return 'volume_off';
    }
    return 'volume_up';
  }

  // --- MÉTODOS DE EVENTOS DEL AUDIO ---

  onMetadataLoaded(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.duration = this.audio.nativeElement.duration;
    }
  }

  onTimeUpdate(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.currentTime = this.audio.nativeElement.currentTime;
    }
  }

  onTrackEnded(): void {
    this.skip('next');
  }

  // --- UTILIDADES ---

  formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${minutes}:${formattedSeconds}`;
  }
}
