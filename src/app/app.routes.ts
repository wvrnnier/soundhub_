import { Routes } from '@angular/router'; // Importar el tipo para definir las rutas
import { LayoutComponent } from './shared/components/layout/layout';
import { ExplorarComponent } from './features/explorar/explorar';

import { TrackDetailComponent } from './shared/components/track-detail/track-detail';
import { PortadaComponent } from './shared/components/portada/portada';
import { AlbumDetail } from './shared/components/album-detail/album-detail';
import { TrackListComponent } from './shared/components/track-list/track-list';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: PortadaComponent },
      { path: 'explorar', component: ExplorarComponent },
      { path: 'tracks', component: TrackListComponent },

      // DENTRO DEL MISMO LAYOUT
      { path: 'trackDetail/:id', component: TrackDetailComponent },
      { path: 'albumDetail/:id', component: AlbumDetail },
    ],
  },
];
