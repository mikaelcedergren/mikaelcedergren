import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

// Body transplanted verbatim from the legacy site by scripts/import-legacy.mjs.
const HTML = "<header>\r\n\r\n  <h1> About <span>Me</span>\r\n  </h1>\r\n</header>\r\n\r\n<section>\r\n  <p> For over 25 years, I’ve immersed myself in Art Direction, Motion Graphics, Graphic Design, and User Experience Design. My journey has taken me across TV, businesses, and digital platforms, turning ideas into reality with a clear focus on both creativity and purpose </p>\r\n  <p>My speciality is the visual communication, what does your brand tell about you, how are you profiling yourself, and what actually makes people listen. And I back this up with beauty and consistency.</p>\r\n  <q>Great design blends clarity, beauty, and user experience, always with a strong intent. </q>\r\n  <p> I’ve had the privilege of building brands that stand out, designing motion graphics that captivate, and creating UI/UX solutions that don’t just look good but work intuitively. My approach isn’t just about aesthetics—it’s about functionality and delivering results. Whether I’m leading a project, brainstorming with a team, or diving deep into the design process, my focus is always on how the work performs and connects with the audience. After all, great design blends clarity, beauty, and user experience, always with a strong intent.</p>\r\n  <p> When it comes to leadership, I believe in balancing authority with collaboration. I listen, support, and challenge, all while steering projects in the right direction. But I’m equally at home in the role of designer, refining ideas, and bringing them to life. At the end of the day, what matters most is the outcome—making sure every project reaches its full potential. </p>\r\n  <p>Outside of work, I’m constantly indulging my curiosity. I dive into behavioral psychology, lose myself in great movies, or turn scrap metal into art. These passions aren’t just hobbies—they’re an extension of how I approach design. Each exploration helps me see the world from different perspectives, continuously shaping how I create, solve problems, and grow as a designer.</p>\r\n  <p>In short - I make bold ideas practical, creating designs that get things done.</p>\r\n  <p> Feel free to check out my <a href=\"/\">portfolio</a>, and if something sparks your interest, drop me a line at <a href=\"mailto:wolfie@mikaelcedergren.com\">wolfie@mikaelcedergren.com</a>.</p>\r\n</section>";

@Component({
  selector: 'mc-about',
  template: '<div [innerHTML]="body"></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  protected readonly body = inject(DomSanitizer).bypassSecurityTrustHtml(HTML);
}
