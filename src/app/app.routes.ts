import { Routes } from '@angular/router'; // Importar el tipo para definir las rutas
import { LayoutComponent } from './shared/components/layout/layout';
import { InicioComponent } from './features/inicio/inicio';
import { ExplorarComponent } from './features/explorar/explorar';

import { TracksListComponent } from './shared/components/track-list/track-list';
import { TrackDetailComponent } from './shared/components/track-detail/track-detail';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: InicioComponent },
      { path: 'explorar', component: ExplorarComponent },
      { path: 'tracks', component: TracksListComponent },

      // 👇 AQUI EL DETALLE, DENTRO DEL MISMO LAYOUT
      { path: 'track/:id', component: TrackDetailComponent },
    ],
  },
];
