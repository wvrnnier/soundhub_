import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SearchBarComponent } from '../search-bar/search-bar';
import { LoginBtnComponent } from '../login-btn/login-btn';

@Component({
    selector: 'app-nav-bar',
    standalone: true,
    templateUrl: './nav-bar.html',
    styleUrls: ['./nav-bar.css'],
    imports: [SearchBarComponent, RouterLink, RouterLinkActive, LoginBtnComponent]
})
export class NavBarComponent {}