import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-artist-card',
  standalone: true,
  templateUrl: './artist-card.html',
  styleUrls: ['./artist-card.css'],
})
export class ArtistCardComponent {
  @Input() artist!: any;
}
