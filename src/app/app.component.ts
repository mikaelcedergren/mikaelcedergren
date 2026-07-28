import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import {
  CxMastheadComponent,
  CxNavigationRecoveryComponent,
  type CxMastheadItem,
} from '@mikaelcedergren/cx-framework';

@Component({
  selector: 'mc-root',
  imports: [RouterOutlet, RouterLink, CxMastheadComponent, CxNavigationRecoveryComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly mastheadItems: CxMastheadItem[] = [
    {
      id: 'portfolio',
      label: 'Portfolio',
      routerLink: '/',
      routerLinkActiveOptions: { exact: true },
    },
    { id: 'resume', label: 'Resume', routerLink: '/resume' },
    { id: 'concepts', label: 'Concepts', routerLink: '/concepts' },
    {
      id: 'blog',
      label: 'Blog',
      href: 'https://mikaelcedergren.substack.com',
      target: '_blank',
      rel: 'noopener',
    },
    { id: 'about', label: 'About', routerLink: '/about' },
  ];
  protected readonly year = new Date().getFullYear();
}
