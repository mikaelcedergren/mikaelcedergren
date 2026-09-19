import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CxLightboxComponent, type CxLightboxImage } from '@mikaelcedergren/cx-framework';

const HTML = "<header>\n\n  <h1><span class=\"hero-word\">Crafting</span> <span class=\"hero-word\">impactful</span> <span class=\"hero-word\">experiences</span> <span class=\"hero-word\">that</span> <span class=\"hero-word\"><span class=\"hero-accent\">tell</span></span> <span class=\"hero-word\"><span class=\"hero-accent\">your</span></span> <span class=\"hero-word\"><span class=\"hero-accent\">story.</span></span></h1>\n</header>\n\n<section>\n  <p class=\"pre-word\"> I believe good design brings beauty and clarity together, making things easier to understand and a pleasure to use. Over 25 years in art direction, branding, and UX, I’ve learned to see how the smallest design decisions contribute to the bigger picture. My work connects how a brand looks and speaks with how people experience it. I care about getting those details right because they shape trust, influence decisions, and ultimately drive results.</p>\n</section>\n\n\n<section>\n  <div class=\"section-header\">\n    <img src=\"/assets/images/portfolio/design/lanefinder-logo.svg\" alt=\"Lanefinder Logo\" />\n    <div>\n      <div class=\"cx-article cx-article--lg cx-article--start\">\n        <p> Lanefinder, a job board tailored specifically for truckers in the trucking industry, has swiftly established itself as a powerhouse within just two years. With an impressive roster of over 5,000 job listings and a loyal customer base exceeding 7,000, this platform has made its mark. </p>\n      </div>\n      <div>\n        <span class=\"tag\">Art Direction</span>\n        <span class=\"tag\">Brand Design</span>\n        <span class=\"tag\">Marketing</span>\n        <span class=\"tag\">Motion Design</span>\n        <span class=\"tag\">Content Strategy</span>\n        <span class=\"tag\">Photography</span>\n        <span class=\"tag\">Videography</span>\n        <span class=\"tag\">UI/UX</span>\n      </div>\n    </div>\n  </div>\n  <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/lanefinder-logo.jpg\" alt=\"Lanefinder Logo\" width=\"1920\" height=\"1080\" /></figure>\n  <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/lanefinder-intro-animation.gif\" alt=\"Lanefinder Intro Animation\" width=\"1308\" height=\"736\" /></figure>\n  <article>\n    <h4>Problem</h4>\n    <p> To establish a noticeable presence in the trucking industry, the Lanefinder brand needed to stand out, convey an appealing attitude to attract its target audience, and communicate a unique identity that differentiates it from competitors. </p>\n    <h4>Solution</h4>\n    <p> I analyzed the competition and decided to adopt a more feminine color scheme to differentiate my work. The colors were carefully selected and applied to evoke the feel of traditional American road signage, creating a familiar yet distinct visual experience for the target audience. </p>\n    <h4>Outcome</h4>\n    <p> The response was overwhelming – within just a year, Lanefinder became a trusted and distinct resource, with truck-driving schools regularly recommending it as a reliable job board with a unique touch. </p>\n  </article>\n  <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/lanefinder-website.jpg\" alt=\"Lanefinder Website\" width=\"1920\" height=\"1080\" /></figure>\n  <article>\n    <h4>Problem</h4>\n    <p> The website acted as the main advertising platform and included uniquely designed landing pages. It was essential in helping users start their job search and connect with our services. </p>\n    <h4>Purpose</h4>\n    <p> The aim was to guide drivers into our app to improve user retention and offer features that benefit both Lanefinder and users, particularly through notifications to keep users engaged. This engagement would not have been possible if the platform existed only on the web, as mobile apps provide unique opportunities for retention and user interaction. </p>\n    <h4>Solution</h4>\n    <p> I positioned the account registration step at the end of the application process to leverage the user's commitment. We also sent follow-up emails and messages to encourage users to download the app, emphasizing benefits like increased visibility of their applications to employers. </p>\n  </article>\n  <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/lanefinder-app-screens.jpg\" alt=\"Lanefinder App Screens\" width=\"1920\" height=\"1080\" /></figure>\n  <article>\n    <h4>Problem</h4>\n    <p> In the trucking industry, drivers need to find specific jobs due to strict regulations, making it challenging for job search platforms to offer enough value to become the go-to option. </p>\n    <h4>Solution</h4>\n    <p> I tackled this by incorporating detailed filters into the design, helping drivers avoid wasting time on jobs they weren't qualified for due to regulations. The app also kept them updated on their application's progress and gently guided them to take actions that benefited both them and us. </p>\n  </article>\n  <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/lanefinder-flow.jpg\" alt=\"Lanefinder UX Flow\" width=\"1920\" height=\"1080\" /></figure>\n  <article>\n    <h4>Problem</h4>\n    <p> Most communication with drivers occurred through the app, Lanefinder's main platform. The challenge was that the trucking industry requires a detailed application with hundreds of fields, which can be tedious, especially for a new job board. Building trust takes time, and this complexity can hinder user engagement. </p>\n    <h4>Solution</h4>\n    <p> I tackled this challenge by simplifying the application process into a pre-qualification stage. Once a driver received interest from a company, Lanefinder sent automated emails and notifications prompting them to complete their profile. It's like playing poker - asking for just enough information upfront to build commitment, while subtly guiding users toward the next step.</p>\n    <p>The trucking recruitment industry is uniquely complicated, heavily influenced by insurance and regulatory requirements. Unlike other industries, I had to learn its ins and outs thoroughly, consolidating a maze of hundreds of screens and workflows. This meant designing a system that didn’t just assess eligibility but also ranked candidates as eligible, a good fit, or a great fit based on algorithmic logic. It was a massive and fun challenge.</p>\n    <p> Ultimately, this method provided companies with key driver information upfront while ensuring they eventually received complete profiles that met DOT and insurance requirements.</p>\n    <h4>Outcome</h4>\n    <p> My strategy significantly increased job applications, growing from just a few to thousands each month. In addition, both surveys Lanefinder conducted showed genuine appreciation for its design and user-friendly flow. </p>\n  </article>\n  <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/lanefinder-component-library.jpg\" alt=\"Lanefinder Component Library\" width=\"1920\" height=\"1080\" /></figure>\n  <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/lanefinder-app-store-screenshots.jpg\" alt=\"Lanefinder App Store Screenshots\" width=\"1920\" height=\"1080\" /></figure>\n  <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/lanefinder-social-media-posts.jpg\" alt=\"Lanefinder Social Media Posts\" width=\"1920\" height=\"1080\" /></figure>\n  <div class=\"two-columns\">\n    <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/lanefinder-sweatshirt.jpg\" alt=\"Lanefinder Sweatshirt\" width=\"1920\" height=\"1080\" /></figure>\n    <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/lanefinder-case-1.jpg\" alt=\"Lanefinder Case\" width=\"1920\" height=\"1080\" /></figure>\n  </div>\n  <div class=\"cx-embed mc-video\">\n    <iframe src=\"https://player.vimeo.com/video/490739497\" title=\"Lanefinder brand video\" frameborder=\"0\" allow=\"autoplay; fullscreen\" allowfullscreen></iframe>\n  </div>\n  <article>\n    <h4>Problem</h4>\n    <p> A clear brand identity was essential for quickly connecting jobs to our clients and making a significant impact on our target market to build a regular customer base. Additionally, time was critical; we needed to disrupt the stagnant practices that have long characterized the trucking industry. </p>\n    <p> Establishing a strong brand not only helps differentiate us from competitors but also builds trust and recognition among potential customers, which is vital for fostering loyalty and driving business growth in this competitive landscape. </p>\n    <h4>Solution</h4>\n    <p> To address the challenge of developing a clear message that stood out among the competition and supported Lanefinder's Unique Selling Proposition, I crafted a distinctive message that effectively communicated the brand's value to truckers. </p>\n    <p> Additionally, I established marketing asset libraries in Figma for both marketing and development, ensuring brand consistency across all media and platforms. This approach not only made it easy for truckers to instantly recognize Lanefinder's communications but also streamlined the development process, allowing teams to work more efficiently while reinforcing a cohesive brand identity. </p>\n  </article>\n</section>\n\n<section>\n  <div class=\"section-header\">\n    <img src=\"/assets/images/portfolio/design/youcruit-logo.svg\" alt=\"YouCruit Logo\" />\n    <div>\n      <div class=\"cx-article cx-article--lg cx-article--start\">\n        <p> YouCruit is an applicant tracking system that initially emerged in Sweden and later expanded its presence to the US, focusing on the trucking industry. </p>\n      </div>\n      <div>\n        <span class=\"tag\">Art Direction</span>\n        <span class=\"tag\">Web Design</span>\n        <span class=\"tag\">Motion Design</span>\n        <span class=\"tag\">Illustration</span>\n        <span class=\"tag\">UI/UX</span>\n      </div>\n    </div>\n  </div>\n  <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/youcruit-logo-animation.gif\" alt=\"YouCruit logo animation\" width=\"800\" height=\"450\" /></figure>\n  <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/youcruit-geophrey.jpg\" alt=\"Geophrey, the YouCruit robot character\" width=\"1920\" height=\"1080\" /></figure>\n  <article>\n    <p> When I joined the company, the logo was already in place. However, since the brand was focused on being fun and playful, I developed various materials to highlight this aspect, including post-processing and motion graphics. </p>\n    <p> In addition, recognizing the need for an enhanced brand identity, I created and introduced Geophrey, a robot character that represents the underlying artificial intelligence of the system. He has appeared in explainer videos, animated iconography, and other creative productions. Dressing Geophrey in different outfits lets him fit any concept or idea and further reinforces the YouCruit brand. </p>\n  </article>\n  <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/youcruit-public.jpg\" alt=\"YouCruit website\" width=\"1920\" height=\"1080\" /></figure>\n  <article>\n    <p> After a few years, the original branding for YouCruit appeared too playful and did not resonate with the target audience as the company shifted its focus to the US trucking industry. To address this, I modernized the design to better reflect the functionality and strength of the Applicant Tracking System. </p>\n    <p> The website was designed to serve as an informative resource for potential customers, providing them with clear calls to action to sign up for our services. </p>\n  </article>\n</section>\n\n<section>\n  <div class=\"section-header\">\n    <img src=\"/assets/images/portfolio/design/youcruit-group-logo.svg\" alt=\"YouCruit Group Logo\" />\n    <div>\n      <div class=\"cx-article cx-article--lg cx-article--start\">\n        <p> Given the diverse range of brands under the YouCruit Group umbrella, there was a necessity for a dedicated site, and brand, tailored specifically for investors. YouCruit Group serves as the centralized hub for all B2B interactions within the company. </p>\n      </div>\n      <div>\n        <span class=\"tag\">Art Direction</span>\n        <span class=\"tag\">UI/UX</span>\n        <span class=\"tag\">Web Design</span>\n        <span class=\"tag\">Web App Design</span>\n      </div>\n    </div>\n  </div>\n  <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/youcruit-group-logo.jpg\" alt=\"YouCruit Group logo\" width=\"1920\" height=\"1080\" /></figure>\n  <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/youcruit-group-brand-manual.jpg\" alt=\"YouCruit Group brand manual\" width=\"1920\" height=\"1080\" /></figure>\n  <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/youcruit-group-public.jpg\" alt=\"YouCruit Group website\" width=\"1920\" height=\"1080\" /></figure>\n</section>\n\n<section>\n  <div class=\"section-header\">\n    <img src=\"/assets/images/portfolio/design/yobify-logo.svg\" alt=\"Yobify Logo\" />\n    <div>\n      <div class=\"cx-article cx-article--lg cx-article--start\">\n        <p> For a brief period, YouCruit expanded its operations into a staffing solution known as 'Yobify,' offering a range of highly competitive staffing options. </p>\n      </div>\n      <div>\n        <span class=\"tag\">Art Direction</span>\n        <span class=\"tag\">UI/UX</span>\n        <span class=\"tag\">Web Design</span>\n        <span class=\"tag\">Web App Design</span>\n      </div>\n    </div>\n  </div>\n  <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/yobify-animation.gif\" alt=\"Yobify logo animation\" width=\"800\" height=\"600\" /></figure>\n  <article>\n    <p> I designed a comprehensive Call Center solution integrated with call interaction, ensuring that every call was transcribed and logged. This approach maximized performance data and strengthened the brand. </p>\n  </article>\n</section>\n\n<section>\n  <div class=\"section-header\">\n    <img src=\"/assets/images/portfolio/design/csg-logo.svg\" alt=\"Connect Sports Group Logo\" />\n    <div>\n      <div class=\"cx-article cx-article--lg cx-article--start\">\n        <p> Agency connecting soccer players with clubs, signing soccer players and producing promotional material. </p>\n      </div>\n      <div>\n        <span class=\"tag\">Design Lead</span>\n        <span class=\"tag\">Graphic Designer</span>\n        <span class=\"tag\">Marketing Strategy</span>\n      </div>\n    </div>\n  </div>\n  <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/csg-social-media-posts.jpg\" alt=\"Connect Sports Group social media artwork\" width=\"1920\" height=\"1080\" /></figure>\n  <div class=\"two-columns\">\n    <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/csg-post-5.jpg\" alt=\"\" width=\"1080\" height=\"1080\" /></figure>\n    <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/csg-post-2.jpg\" alt=\"\" width=\"1080\" height=\"1080\" /></figure>\n  </div>\n  <div class=\"two-columns\">\n    <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/csg-post-6.jpg\" alt=\"\" width=\"1080\" height=\"1080\" /></figure>\n    <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/csg-post-1.jpg\" alt=\"\" width=\"1080\" height=\"1080\" /></figure>\n  </div>\n  <article>\n    <p> I've consulted on business strategy and created graphic promotional material for social media advertising. Through the exposure these graphics provided, several players have signed with Connect Sports Group. </p>\n  </article>\n</section>\n\n<section>\n  <div class=\"section-header\">\n    <img src=\"/assets/images/portfolio/design/brainteam-logo.svg\" alt=\"Brainteam Logo\" />\n    <div>\n      <div class=\"cx-article cx-article--lg cx-article--start\">\n        <p> I took on a freelance project for a company focused on combining environmental sustainability with technology. They required a complete branding package to effectively communicate their mission and values. </p>\n      </div>\n      <div>\n        <span class=\"tag\">Branding</span>\n        <span class=\"tag\">Print Design</span>\n        <span class=\"tag\">Web Design</span>\n      </div>\n    </div>\n  </div>\n  <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/brainteam-logo.jpg\" alt=\"Brainteam logo\" width=\"1920\" height=\"1080\" /></figure>\n  <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/brainteam-stationary.jpg\" alt=\"Brainteam stationery\" width=\"1920\" height=\"1080\" /></figure>\n  <article>\n    <p> Brainteam is a tech consultancy firm with a strong emphasis on sustainability. Instead of fully committing to a green approach, I sought to blend their technological expertise with their sustainability values. </p>\n    <p> A comprehensive branding package was delivered, encompassing presentation materials, branding elements, and web and print assets. </p>\n  </article>\n</section>\n\n<section>\n  <div class=\"section-header\">\n    <img src=\"/assets/images/portfolio/design/personal-brand-logo.svg\" alt=\"Freelance Logo\" />\n    <div>\n      <div class=\"cx-article cx-article--lg cx-article--start\">\n        <p> The book cover project for Ola Hasselgren features a captivating romance between a pilot and a flight attendant, exploring the unique challenges and joys of love in the skies. </p>\n      </div>\n      <div>\n        <span class=\"tag\">Book Cover Design</span>\n      </div>\n    </div>\n  </div>\n  <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/ola-hasselgren-book-cover.jpg\" alt=\"Ola Hasselgren book cover\" width=\"1920\" height=\"1080\" /></figure>\n</section>\n\n<section>\n  <div class=\"section-header\">\n    <img src=\"/assets/images/portfolio/design/pod-logo.svg\" alt=\"Psychology of Design Logo\" />\n    <div>\n      <div class=\"cx-article cx-article--lg cx-article--start\">\n        <p> Ongoing project tackling the mindset challenges of being a designer from my perspective as an experienced Art Director. </p>\n      </div>\n      <div>\n        <span class=\"tag\">Brand Design</span>\n        <span class=\"tag\">Marketing Strategy</span>\n      </div>\n    </div>\n  </div>\n  <figure class=\"mc-parallax\"><img src=\"/assets/images/portfolio/design/pod-intro.gif\" alt=\"Psychology of Design logo animation\" width=\"870\" height=\"490\" /></figure>\n</section>\n\n<section>\n  <div class=\"section-header\">\n    <img src=\"/assets/images/portfolio/design/svt-logo.svg\" alt=\"SVT Logo\" />\n    <div>\n      <div class=\"cx-article cx-article--lg cx-article--start\">\n        <p> This reel reflects my earlier motion graphics skills, but I've since made significant progress in my craft. I take particular pride in conceptualizing the \"På Spåret\" idea of filming toy trains with a realistic touch. Although my original intro has been replaced, I'm pleased to see that other graphic artists have carried on my concept, preserving its essence a decade later. </p>\n      </div>\n      <div>\n        <span class=\"tag\">Creative Director</span>\n        <span class=\"tag\">Motion Graphics</span>\n        <span class=\"tag\">Post Processing</span>\n        <span class=\"tag\">Brand Design</span>\n      </div>\n    </div>\n  </div>\n  <div class=\"cx-embed mc-video\">\n    <iframe src=\"https://player.vimeo.com/video/752191176?h=67c73ed7e4&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479\" frameborder=\"0\" allow=\"autoplay; fullscreen; picture-in-picture\" allowfullscreen style=\"position: absolute; top: 0; left: 0; width: 100%; height: 100%\" title=\"Graphic Showreel 2009.mp4\"></iframe>\n  </div>\n</section>\n";

const VIMEO_VIDEOS = {
  'lanefinder-brand': {
    markupSource: 'https://player.vimeo.com/video/490739497',
    source: 'https://player.vimeo.com/video/490739497',
    title: 'Lanefinder brand video',
    buttonLabel: 'Watch Lanefinder brand video',
    poster: '/assets/images/portfolio/design/lanefinder-video-cover.jpg',
  },
  'svt-showreel': {
    markupSource:
      'https://player.vimeo.com/video/752191176?h=67c73ed7e4&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479',
    source:
      'https://player.vimeo.com/video/752191176?h=67c73ed7e4&badge=0&autopause=0&player_id=0&app_id=58479',
    title: 'Graphic showreel 2009',
    buttonLabel: 'Watch graphic showreel 2009',
    poster: '/assets/images/portfolio/design/svt-showreel-cover.jpg',
  },
} as const;

type VimeoVideoKey = keyof typeof VIMEO_VIDEOS;

const VIMEO_IFRAME_PATTERN =
  /<iframe\b[^>]*\bsrc="(https:\/\/player\.vimeo\.com\/video\/[^"]+)"[^>]*><\/iframe>/g;

const PORTFOLIO_HTML = deferVimeoEmbeds(HTML);
const GALLERY = prepareGallery(PORTFOLIO_HTML);

function prepareGallery(html: string): { html: string; images: CxLightboxImage[] } {
  const images: CxLightboxImage[] = [];
  const galleryHtml = html.replace(
    /<figure class="mc-parallax">(<img\b[^>]*>)<\/figure>/g,
    (_frame, image: string) => {
      const src = image.match(/\bsrc="([^"]+)"/)![1];
      const alt = image.match(/\balt="([^"]*)"/)![1];
      const index = images.length;
      images.push({ src, alt: alt || `Portfolio artwork ${index + 1}` });
      return `<figure class="mc-parallax"><button type="button" class="mc-image-trigger" data-gallery-index="${index}" aria-haspopup="dialog" aria-label="View portfolio image ${index + 1}">${image}</button></figure>`;
    },
  );
  return { html: galleryHtml, images };
}

function deferVimeoEmbeds(html: string): string {
  const videos = Object.entries(VIMEO_VIDEOS) as [
    VimeoVideoKey,
    (typeof VIMEO_VIDEOS)[VimeoVideoKey],
  ][];
  const deferred = new Set<VimeoVideoKey>();

  const result = html.replace(VIMEO_IFRAME_PATTERN, (_iframe, markupSource: string) => {
    const match = videos.find(([, video]) => video.markupSource === markupSource);
    if (!match) {
      throw new Error(`Unsupported Vimeo portfolio source: ${markupSource}`);
    }

    const [key, video] = match;
    deferred.add(key);
    return `<button type="button" class="mc-video-consent" data-vimeo-video="${key}" aria-label="${video.buttonLabel}"><img src="${video.poster}" alt="" width="1280" height="720" loading="lazy" decoding="async" /><span class="mc-video-consent__play" aria-hidden="true"></span></button>`;
  });

  if (deferred.size !== videos.length) {
    throw new Error('Every configured Vimeo portfolio video must have exactly one content embed.');
  }

  return result;
}

@Component({
  selector: 'mc-home',
  imports: [CxLightboxComponent],
  template: `<div class="home-page" [innerHTML]="body()" (click)="onPortfolioClick($event)"></div>
    <cx-lightbox
      [images]="galleryImages"
      [(index)]="lightboxIndex"
      [(open)]="lightboxOpen"
      ariaLabel="Portfolio images"
    />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private readonly desktopGallery = signal(false);
  protected readonly galleryImages = GALLERY.images;
  protected readonly lightboxIndex = signal(0);
  protected readonly lightboxOpen = signal(false);
  protected readonly body = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.desktopGallery() ? GALLERY.html : PORTFOLIO_HTML),
  );

  constructor() {
    afterNextRender(() => {
      const breakpoint = getComputedStyle(document.documentElement)
        .getPropertyValue('--breakpoint-mobile')
        .trim();
      const desktop = window.matchMedia(
        `(min-width: ${breakpoint}) and (hover: hover) and (pointer: fine)`,
      );
      const sync = () => {
        if (!desktop.matches) this.lightboxOpen.set(false);
        this.desktopGallery.set(desktop.matches);
      };
      sync();
      desktop.addEventListener('change', sync);
      this.destroyRef.onDestroy(() => desktop.removeEventListener('change', sync));
    });
  }

  protected onPortfolioClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const image = target.closest<HTMLButtonElement>('button[data-gallery-index]');
    if (image && this.desktopGallery()) {
      this.lightboxIndex.set(Number(image.dataset['galleryIndex']));
      this.lightboxOpen.set(true);
      return;
    }
    this.loadVimeo(event);
  }

  private loadVimeo(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const trigger = target.closest<HTMLButtonElement>('button[data-vimeo-video]');
    const key = trigger?.dataset['vimeoVideo'] as VimeoVideoKey | undefined;
    const video = key ? VIMEO_VIDEOS[key] : undefined;
    if (!trigger || !video) return;

    const iframe = trigger.ownerDocument.createElement('iframe');
    const separator = video.source.includes('?') ? '&' : '?';
    iframe.src = `${video.source}${separator}autoplay=1`;
    iframe.title = video.title;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    trigger.replaceWith(iframe);
  }
}
