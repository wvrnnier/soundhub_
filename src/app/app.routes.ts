import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/components/layout/layout';
import { TrackDetailComponent } from './shared/components/track-detail/track-detail';
import { HomeComponent } from './shared/components/home/home';
import { AlbumDetail } from './shared/components/album-detail/album-detail';
import { TrackListComponent } from './shared/components/track-list/track-list';
import { ProfileComponent } from './shared/components/profile/profile';
import { PlayList } from './shared/components/playlist/play-list/play-list';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'tracks', component: TrackListComponent },
      { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
      { path: 'playlist', component: PlayList, canActivate: [authGuard] },
      { path: 'playlist/:id', component: PlayList, canActivate: [authGuard] },


      // DENTRO DEL MISMO LAYOUT
      { path: 'trackDetail/:id', component: TrackDetailComponent },
      { path: 'albumDetail/:id', component: AlbumDetail },
    ],
  },
];
