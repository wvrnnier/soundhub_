import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideBar } from '../side-bar/side-bar';
import { Library } from '../components/library/library';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SideBar, Library],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css'],
})
export class Layout {}
