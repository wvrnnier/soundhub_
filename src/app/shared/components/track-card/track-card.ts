import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Track } from '../../../core/services/music-service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-track-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './track-card.html',
  styleUrls: ['./track-card.css'],
})
export class TrackCardComponent {
  // Recibo el track ya cargado
  track = input.required<Track>();
}
