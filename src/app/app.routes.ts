import { Routes } from '@angular/router';
import { Layout } from './shared/layout/layout';
import { InicioComponent } from './features/inicio/inicio';
import { ExplorarComponent } from './features/explorar/explorar';
import { FavoritasComponent } from './features/favoritas/favoritas';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: '', component: InicioComponent },
      { path: 'explorar', component: ExplorarComponent },
      { path: 'favoritas', component: FavoritasComponent }
    ]
  }
];
