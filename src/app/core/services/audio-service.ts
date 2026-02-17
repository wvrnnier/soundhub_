import { Injectable, Inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Track } from './music-service';


@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private audio: HTMLAudioElement | null = null;

  currentTrack = signal<Track | null>(null);
  isPlaying = signal(false);
  currentTime = signal(0);
  duration = signal(0);
  volume = signal(0.2);
  isMuted = signal(false);
  isShuffle = signal(false);
  isLoop = signal(false);
  queue = signal<Track[]>([]);

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    if (isPlatformBrowser(platformId)) {
      this.audio = new Audio();
      this.audio.volume = 0.2;
      this.attachEvents();
    }
  }

  private attachEvents() {
    if (!this.audio) return;

    this.audio.addEventListener('timeupdate', () => {
      this.currentTime.set(this.audio?.currentTime || 0);
    });

    this.audio.addEventListener('loadedmetadata', () => {
      this.duration.set(this.audio?.duration || 0);
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying.set(false);
      this.currentTime.set(0);
      this.next();
    });

    this.audio.addEventListener('play', () => this.isPlaying.set(true));
    this.audio.addEventListener('pause', () => this.isPlaying.set(false));
  }

  private originalQueue: Track[] = [];

  playTrack(track: Track, queue: Track[] = []) {
    if (!this.audio) return;

    if (queue.length > 0) {
      if (this.isShuffle()) {
        this.setupShuffleQueue(track, queue);
      } else {
        this.queue.set(queue);
        this.originalQueue = [];
      }
    }

    // Si es la misma canción, pausar/reanudar
    if (this.currentTrack()?.id === track.id) {
      this.togglePlay();
      return;
    }

    // Si es nueva, cargar y reproducir
    if (!track.previewUrl) return;
    this.currentTrack.set(track);
    this.audio.src = track.previewUrl;
    this.audio.load();
    this.play();
  }


  togglePlay() {
    this.isPlaying() ? this.pause() : this.play();
  }

  play() {
    this.audio?.play().catch(err => console.error('Error:', err));
  }

  pause() {
    this.audio?.pause();
  }

  seek(time: number) {
    if (this.audio) this.audio.currentTime = time;
  }

  setVolume(vol: number) {
    if (this.audio) {
      this.volume.set(vol);
      this.audio.volume = vol;
      if (vol > 0 && this.isMuted()) this.unmute();
    }
  }

  mute() {
    if (this.audio) {
      this.audio.muted = true;
      this.isMuted.set(true);
    }
  }

  unmute() {
    if (this.audio) {
      this.audio.muted = false;
      this.isMuted.set(false);
    }
  }

  next() {
    const current = this.currentTrack();
    const queue = this.queue();
    if (!current || queue.length === 0) return;

    const index = queue.findIndex(t => t.id === current.id);
    if (index !== -1 && index < queue.length - 1) {
      this.playTrack(queue[index + 1]);
    } else if (this.isLoop() && queue.length > 0) {
      this.playTrack(queue[0]);
    }
  }

  prev() {
    const current = this.currentTrack();
    const queue = this.queue();
    if (!current || queue.length === 0) return;

    const index = queue.findIndex(t => t.id === current.id);
    // Si no es la primera, volvemos a la anterior
    if (index > 0) {
      this.playTrack(queue[index - 1]);
    }
  }

  toggleMute() {
    this.isMuted() ? this.unmute() : this.mute();
  }

  toggleShuffle() {
    const newState = !this.isShuffle();
    this.isShuffle.set(newState);

    const currentTrack = this.currentTrack();
    const currentQueue = this.queue(); // En ese momento es la lista "normal"

    if (newState) {
      if (currentTrack && currentQueue.length > 0) {
        this.setupShuffleQueue(currentTrack, currentQueue);
      }
    } else {
      // Restaurar original
      if (this.originalQueue.length > 0) {
        this.queue.set(this.originalQueue);
        this.originalQueue = [];
      }
    }
  }

  private setupShuffleQueue(track: Track, sourceQueue: Track[]) {
    this.originalQueue = [...sourceQueue]; // Guardamos copia del orden original
    const shuffled = this.shuffleArray([...sourceQueue]);

    // Poner la canción actual al principio
    const index = shuffled.findIndex(t => t.id === track.id);
    if (index > -1) {
      shuffled.splice(index, 1);
      shuffled.unshift(track);
    }
    this.queue.set(shuffled);
  }

  private shuffleArray(array: Track[]): Track[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }


  toggleLoop() {
    this.isLoop.set(!this.isLoop());
  }


}