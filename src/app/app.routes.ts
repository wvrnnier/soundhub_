import { Routes } from '@angular/router'; // Importar el tipo para definir las rutas
import { LayoutComponent } from './shared/components/layout/layout';
import { TrackDetailComponent } from './shared/components/track-detail/track-detail';
import { HomeComponent } from './shared/components/home/home';
import { AlbumDetail } from './shared/components/album-detail/album-detail';
import { TrackListComponent } from './shared/components/track-list/track-list';
import { ProfileComponent } from './shared/components/profile/profile';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'tracks', component: TrackListComponent },
      { path: 'profile', component: ProfileComponent },

      // DENTRO DEL MISMO LAYOUT
      { path: 'trackDetail/:id', component: TrackDetailComponent },
      { path: 'albumDetail/:id', component: AlbumDetail },
    ],
  },
];
