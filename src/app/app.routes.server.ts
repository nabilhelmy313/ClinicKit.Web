import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
    // Dynamic routes (have :id params) — rendered on the server per-request
    { path: 'patients/:id',      renderMode: RenderMode.Server },
    { path: 'appointments/:id',  renderMode: RenderMode.Server },
    { path: 'billing/:id',       renderMode: RenderMode.Server },
    { path: 'doctors/:id',       renderMode: RenderMode.Server },

    // All other routes — prerendered at build time
    { path: '**', renderMode: RenderMode.Prerender },
];
