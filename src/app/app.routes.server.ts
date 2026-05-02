import { RenderMode, ServerRoute } from '@angular/ssr';

// All routes are behind authentication — no SEO or prerender benefit.
// Client-side rendering avoids server-route mismatches on page reload.
export const serverRoutes: ServerRoute[] = [
    { path: '**', renderMode: RenderMode.Client },
];
