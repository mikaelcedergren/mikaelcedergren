import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

const HTML = "<section class=\"cx-measure-md cx-py-2xl cx-px-lg cx-text-center\"><h1>404</h1><p>This page could not be found.</p><p><a href=\"/\">Back to the portfolio</a></p></section>";

@Component({
  selector: 'mc-not-found',
  template: '<div [innerHTML]="body"></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {
  protected readonly body = inject(DomSanitizer).bypassSecurityTrustHtml(HTML);
}
