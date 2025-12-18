import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Track } from '../../../core/services/music-service';

@Component({
  selector: 'app-track-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './track-detail.html',
})
export class TrackDetailComponent {
  // track = signal<Track | null>(null);
  // constructor(private router: Router) {}
  // ngOnInit() {
  //   // 1) Intentamos recuperar el track desde el estado de navegación
  //   const nav = this.router.getCurrentNavigation();
  //   const savedTrack = nav?.extras?.state?.['track'];
  //   if (savedTrack) {
  //     this.track.set(savedTrack);
  //     return;
  //   }
  //   // 2) Si no viene track (por ejemplo, refrescan la página), mostramos mensaje
  //   console.warn('No track received. You must navigate from TrackList.');
  // }
}
