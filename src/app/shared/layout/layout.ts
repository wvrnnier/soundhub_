import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideBar } from '../side-bar/side-bar';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SideBar],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css'],
})
export class Layout {}
