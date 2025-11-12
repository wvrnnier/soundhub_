import { PlayList } from './shared/components/play-list/play-list';
import { ImportarMusica } from './shared/components/importar-musica/importar-musica';
import { Routes } from '@angular/router';
import { Layout } from './shared/layout/layout';
import { InicioComponent } from './features/inicio/inicio';
import { ExplorarComponent } from './features/explorar/explorar';
import { FavoritasComponent } from './features/favoritas/favoritas';
import { PodCasts } from './shared/components/pod-casts/pod-casts';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: '', component: InicioComponent },
      { path: 'explorar', component: ExplorarComponent },
      { path: 'favoritas', component: FavoritasComponent },
      { path: 'library/importar', component: ImportarMusica },
      { path: 'library/playList', component: PlayList },
      { path: 'library/podCasts', component: PodCasts },
    ],
  },
];
