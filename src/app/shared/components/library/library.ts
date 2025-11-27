import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-library',
  imports: [RouterLink],
  templateUrl: './library.html',
  styleUrl: './library.css',
})
export class Library {}
