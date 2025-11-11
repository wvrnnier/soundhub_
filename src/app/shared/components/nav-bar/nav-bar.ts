import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SearchBarComponent } from '../search-bar/search-bar';

@Component({
    selector: 'app-nav-bar',
    standalone: true,
    templateUrl: './nav-bar.html',
    styleUrls: ['./nav-bar.css'],
    imports: [SearchBarComponent, RouterLink, RouterLinkActive]
})
export class NavBarComponent {
    onSearch(searchTerm: string){
        console.log('Busqueda:', searchTerm);
}}