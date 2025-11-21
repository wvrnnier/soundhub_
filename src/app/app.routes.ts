import { Routes } from '@angular/router'; // Importar el tipo para definir las rutas
import { LayoutComponent } from './shared/components/layout/layout';
//Componente  que actúa como marco.
import { InicioComponent } from './features/inicio/inicio';
import { ExplorarComponent } from './features/explorar/explorar';

export const routes: Routes = [ // Exporta un array de rutas
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: InicioComponent },
      { path: 'explorar', component: ExplorarComponent },
    ]
  }
];
