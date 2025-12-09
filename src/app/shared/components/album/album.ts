import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Album } from '../../../core/services/music-service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-album',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './album.html',
  styleUrl: './album.css',
})
export class AlbumComponent {
  album = input.required<Album>();
}
