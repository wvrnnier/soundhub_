import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlayerBarComponent } from '../app/shared/components/player-bar/player-bar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PlayerBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
