import { Component, input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlaylistSummary } from '../../../core/services/playlist-service';

@Component({
  selector: 'app-playlist-card',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './playlist-card.html',
  styleUrl: './playlist-card.css',
})
export class PlaylistCardComponent {
  playlist = input.required<PlaylistSummary>();
}