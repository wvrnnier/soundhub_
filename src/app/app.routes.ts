import { Routes } from '@angular/router';
import { InicioComponent } from './features/inicio/inicio';
import { ExplorarComponent } from './features/explorar/explorar';
export const routes: Routes = [
    { path: '', component: InicioComponent },
    { path: 'explorar', component: ExplorarComponent }
];


