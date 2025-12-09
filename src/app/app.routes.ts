import { Routes } from '@angular/router'; // Importar el tipo para definir las rutas
import { LayoutComponent } from './shared/components/layout/layout';
import { InicioComponent } from './features/inicio/inicio';
import { ExplorarComponent } from './features/explorar/explorar';

import { TrackDetailComponent } from './shared/components/track-detail/track-detail';
import { PortadaComponent } from './shared/components/portada/portada';
import { AlbumDetail } from './shared/components/album-detail/album-detail';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: InicioComponent },
      { path: 'explorar', component: ExplorarComponent },
      { path: 'portada', component: PortadaComponent },

      // DENTRO DEL MISMO LAYOUT
      { path: 'trackDetail/:id', component: TrackDetailComponent },
      { path: 'albumDetail/:id', component: AlbumDetail },
    ],
  },
];
