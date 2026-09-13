// Runs only in the isolated PDF renderer, against the prerendered resume content.
export function createResumeDocument() {
  const resume = document.querySelector('mc-resume');
  if (!resume) throw new Error('The resume source is missing.');
  const sections = [...resume.querySelectorAll('section')].map((section) =>
    section.cloneNode(true),
  );
  const aside = resume.querySelector('aside').cloneNode(true);
  const role = resume.querySelector('header h1').textContent.trim();
  const contact = aside.querySelector('p');
  const [email, phone] = contact.innerHTML.split(/<br\s*\/?>/);
  const linkedin = aside.querySelector('.links a').href;
  const documentElement = document.createElement('article');
  documentElement.className = 'cv-document';
  const header = document.createElement('header');
  header.className = 'cv-header';
  const portrait = aside.querySelector('img.portrait');
  header.innerHTML = `<div><p class="cv-label">Curriculum vitae</p><h1>Mikael Cedergren</h1><p class="cv-role"></p><div class="cv-contact"><a href="mailto:${email}">${email}</a><span>${phone}</span><a href="https://mikaelcedergren.com/">mikaelcedergren.com</a><a href="${linkedin}">LinkedIn</a></div></div>`;
  header.querySelector('.cv-role').textContent = role;
  header.append(portrait);
  documentElement.append(header);
  for (const section of sections) {
    const heading = section.querySelector('h1');
    const replacement = document.createElement('h2');
    replacement.textContent = heading.textContent;
    section.dataset.section = heading.textContent.trim();
    heading.replaceWith(replacement);
    section.querySelectorAll('q').forEach((quote) => quote.remove());
    section.querySelectorAll('h2.resume-eyebrow').forEach((heading) => {
      const subheading = document.createElement('h3');
      subheading.textContent = heading.textContent;
      heading.replaceWith(subheading);
    });
    // Group each role/project so a page break cannot strand its heading or date.
    if (
      ['Work Experience', 'Selected Projects', 'Education', 'Recognition'].includes(
        section.dataset.section,
      )
    ) {
      let entry;
      for (const child of [...section.children].slice(1)) {
        if (
          child.tagName === 'H3' ||
          (child.tagName === 'STRONG' && section.dataset.section !== 'Work Experience')
        ) {
          entry = document.createElement('div');
          entry.className = 'cv-entry';
          section.insertBefore(entry, child);
        }
        entry?.append(child, document.createTextNode('\n'));
      }
    }
  }
  const take = (name) => {
    const section = sections.find((item) => item.dataset.section === name);
    if (!section) throw new Error(`Missing resume section: ${name}`);
    return section;
  };
  documentElement.append(take('About Me'));
  const skills = document.createElement('section');
  skills.className = 'cv-skills';
  skills.innerHTML = '<h2>Skills & tools</h2>';
  aside.querySelectorAll('h5').forEach((heading) => {
    if (heading.textContent === 'Contact') return;
    const label = document.createElement('h3');
    label.textContent = heading.textContent;
    skills.append(label, heading.nextElementSibling.cloneNode(true));
  });
  documentElement.append(skills);
  for (const name of [
    'Work Experience',
    'Selected Projects',
    'Education',
    'Recognition',
    'Other skills',
    'Recommendations',
  ]) {
    documentElement.append(take(name));
  }
  document.title = 'Mikael Cedergren — CV';
  document.body.replaceChildren(documentElement);
}
