import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Artist } from '../../../core/services/music-service';

@Component({
  selector: 'app-artist-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './artist-card.html',
  styleUrl: './artist-card.css',
})
export class ArtistCardComponent {
  artist = input.required<Artist>(); // señal moderna
}
