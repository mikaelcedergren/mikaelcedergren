import { RenderMode, ServerRoute } from '@angular/ssr';

/** Prerender every route to static HTML at build time (SSG). */
export const serverRoutes: ServerRoute[] = [{ path: '**', renderMode: RenderMode.Prerender }];
