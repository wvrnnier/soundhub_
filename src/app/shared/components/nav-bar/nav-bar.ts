import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SearchBarComponent } from '../search-bar/search-bar';
import { LoginBtnComponent } from '../login-btn/login-btn';
@Component({
    selector: 'app-nav-bar',
    standalone: true,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './nav-bar.html',
    styleUrls: ['./nav-bar.css'],
    imports: [SearchBarComponent, RouterLink, RouterLinkActive, LoginBtnComponent]
})
export class NavBarComponent { }