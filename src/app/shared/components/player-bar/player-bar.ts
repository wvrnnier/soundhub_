import { Component } from '@angular/core';
import { PlayerComponent } from '../player/player';

@Component({
    selector: 'app-player-bar',
    standalone: true,
    templateUrl: './player-bar.html',
    styleUrls: ['./player-bar.css'],
    imports: [PlayerComponent]
})
export class PlayerBarComponent {}