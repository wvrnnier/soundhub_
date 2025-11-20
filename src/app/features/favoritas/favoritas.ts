import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgFor } from '@angular/common';
@Component({
  selector: 'app-favoritas',
  templateUrl: './favoritas.html',
  styleUrls: ['./favoritas.css'],
  imports: [CommonModule, NgFor],
})
export class FavoritasComponent {
  favoritas = [
    { title: 'Imagine', artist: 'John Lennon' },
    { title: 'Bohemian Rhapsody', artist: 'Queen' }
  ];
}

