import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

export const SITE_ORIGIN = 'https://mikaelcedergren.com';
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/assets/images/og-image.jpg`;

/** Per-page SEO, carried on each route's `data.seo`. */
export interface PageSeo {
  /** Canonical path, e.g. '/' or '/blog/posts/ui-and-ux.html'. */
  path: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  /** Absolute image URL; defaults to the site og-image. */
  ogImage?: string;
  /** og:type — 'website' (default) or 'article' for blog posts. */
  ogType?: string;
  noindex?: boolean;
  /** Extra JSON-LD @graph nodes (e.g. a BlogPosting) appended after Person/WebSite/WebPage. */
  graph?: object[];
}

/**
 * Sets title + per-route description, canonical, Open Graph, Twitter and JSON-LD @graph on every
 * navigation. Runs during prerendering too, so each static page ships with its own metadata.
 * Single-locale (English).
 */
@Injectable()
export class SeoTitleStrategy extends TitleStrategy {
  constructor(
    private readonly titleService: Title,
    private readonly meta: Meta,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    let route = snapshot.root;
    while (route.firstChild) route = route.firstChild;

    const seo = (route.data['seo'] as PageSeo | undefined) ?? { path: '/', description: '' };
    const title = this.buildTitle(snapshot) ?? 'Mikael Cedergren';
    const canonical = SITE_ORIGIN + seo.path;
    const ogImage = seo.ogImage ?? DEFAULT_OG_IMAGE;
    const ogTitle = seo.ogTitle ?? title;
    const ogDescription = seo.ogDescription ?? seo.description;

    this.document.documentElement.setAttribute('lang', 'en');
    this.titleService.setTitle(title);
    this.meta.updateTag({ name: 'description', content: seo.description });
    if (seo.keywords) {
      this.meta.updateTag({ name: 'keywords', content: seo.keywords });
    }
    if (seo.noindex) {
      this.meta.updateTag({ name: 'robots', content: 'noindex, follow' });
    } else {
      this.meta.removeTag("name='robots'");
    }

    this.meta.updateTag({ property: 'og:type', content: seo.ogType ?? 'website' });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:site_name', content: 'Mikael Cedergren' });
    this.meta.updateTag({ property: 'og:locale', content: 'en_US' });
    this.meta.updateTag({ property: 'og:image', content: ogImage });
    this.meta.updateTag({ property: 'og:title', content: ogTitle });
    this.meta.updateTag({ property: 'og:description', content: ogDescription });
    this.meta.updateTag({ property: 'og:image:width', content: '1200' });
    this.meta.updateTag({ property: 'og:image:height', content: '630' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: ogTitle });
    this.meta.updateTag({ name: 'twitter:description', content: ogDescription });
    this.meta.updateTag({ name: 'twitter:image', content: ogImage });

    this.setCanonical(canonical);
    this.setJsonLd(this.buildGraph(canonical, title, seo.description, ogImage, seo.graph ?? []));
  }

  private setCanonical(url: string): void {
    const head = this.document.head;
    let link = head.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private buildGraph(
    canonical: string,
    title: string,
    description: string,
    image: string,
    extra: object[],
  ): object {
    const graph: object[] = [
      {
        '@type': 'Person',
        '@id': `${SITE_ORIGIN}/#person`,
        name: 'Mikael Cedergren',
        url: `${SITE_ORIGIN}/`,
        jobTitle: 'Art Director & User Experience Designer',
        image,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        url: `${SITE_ORIGIN}/`,
        name: 'Mikael Cedergren',
        inLanguage: 'en-US',
        publisher: { '@id': `${SITE_ORIGIN}/#person` },
      },
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: title,
        description,
        inLanguage: 'en-US',
        isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
        publisher: { '@id': `${SITE_ORIGIN}/#person` },
      },
      ...extra,
    ];
    return { '@context': 'https://schema.org', '@graph': graph };
  }

  private setJsonLd(data: object | null): void {
    const id = 'mc-jsonld';
    let script = this.document.getElementById(id) as HTMLScriptElement | null;
    if (!data) {
      script?.remove();
      return;
    }
    if (!script) {
      script = this.document.createElement('script');
      script.id = id;
      script.setAttribute('type', 'application/ld+json');
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }
}
