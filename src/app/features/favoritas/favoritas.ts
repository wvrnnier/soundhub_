import { Component } from '@angular/core';

@Component({
  selector: 'app-favoritas',
  templateUrl: './favoritas.html',
  styleUrls: ['./favoritas.css']
})
export class FavoritasComponent {
  favoritas = [
    { title: 'Imagine', artist: 'John Lennon' },
    { title: 'Bohemian Rhapsody', artist: 'Queen' }
  ];
}

