import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from './shared/components/nav-bar/nav-bar';
import { Layout } from './shared/layout/layout';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBarComponent, Layout],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('AngularProyecto');
}
