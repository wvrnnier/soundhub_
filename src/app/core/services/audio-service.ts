import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private audio: HTMLAudioElement | null = null;
  private currentUrl: string | null = null;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    if (isPlatformBrowser(platformId)) {
      this.audio = new Audio();
    }
  }

  play(url: string) {
    if (!this.audio) return;

    if (this.currentUrl === url) {
      this.audio.pause();
      this.currentUrl = null;
      return;
    }

    this.audio.pause();
    this.audio.src = url;
    this.audio.load();
    this.audio.play();
    this.currentUrl = url;
  }

  stop() {
    this.audio?.pause();
    this.currentUrl = null;
  }
}
