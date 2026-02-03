import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'trackDetail/:id',
    renderMode: RenderMode.Server // Usamos SSR en lugar de Prerender para estas páginas dependientes de un id
  },
  {
    path: 'albumDetail/:id',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];