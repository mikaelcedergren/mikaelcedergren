import { Routes } from '@angular/router';
import { PageSeo } from './shared/seo';

// Canonical route and page metadata. Edit this file and src/app/pages/** directly.
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: "Mikael Cedergren | Art Director, Content Strategist & User Experience Designer",
    data: { seo: { path: '/', description: "Explore the work of Mikael Cedergren, a designer focused on simple, effective, and meaningful creative solutions." } satisfies PageSeo },
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
    title: "About | Mikael Cedergren",
    data: { seo: { path: '/about/', description: "Explore the work of Mikael Cedergren, a designer focused on simple, effective, and meaningful creative solutions." } satisfies PageSeo },
  },
  {
    path: 'resume',
    loadComponent: () => import('./pages/resume/resume.component').then((m) => m.ResumeComponent),
    title: "Resume | Mikael Cedergren",
    data: { seo: { path: '/resume/', description: "Explore the work of Mikael Cedergren, a designer focused on simple, effective, and meaningful creative solutions." } satisfies PageSeo },
  },
  {
    path: 'concepts',
    loadComponent: () => import('./pages/concepts/concepts.component').then((m) => m.ConceptsComponent),
    title: "Concepts | Mikael Cedergren",
    data: { seo: { path: '/concepts/', description: "Explore the work of Mikael Cedergren, a designer focused on simple, effective, and meaningful creative solutions." } satisfies PageSeo },
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: 'Page not found | Mikael Cedergren',
    data: { seo: { path: '/404', description: 'Page not found.', noindex: true } satisfies PageSeo },
  },
];
