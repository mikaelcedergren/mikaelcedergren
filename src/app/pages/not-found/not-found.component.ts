import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

// Body transplanted verbatim from the legacy site by scripts/import-legacy.mjs.
const HTML = "<section style=\"max-width:640px;margin:4rem auto;padding:0 1.5rem;text-align:center\"><h1>404</h1><p>This page could not be found.</p><p><a href=\"/\">Back to the portfolio</a></p></section>";

@Component({
  selector: 'mc-not-found',
  template: '<div [innerHTML]="body"></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {
  protected readonly body = inject(DomSanitizer).bypassSecurityTrustHtml(HTML);
}
