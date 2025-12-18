import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Album } from '../../../core/services/music-service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-album-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './album-card.html',
  styleUrl: './album-card.css',
})
export class AlbumCardComponent {
  //<Album>describe EXACTAMENTE lo que entra al componente
  album = input.required<Album>(); //con el required evitado undefind
}
