import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SideBarComponent } from '../components/side-bar/side-bar';
import { NavBarComponent } from '../components/nav-bar/nav-bar';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SideBarComponent, NavBarComponent],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css'],
})
export class Layout {}
