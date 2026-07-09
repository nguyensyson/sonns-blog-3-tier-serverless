// Builds a table of contents from rendered post HTML by scanning h1/h2/h3
// tags, assigning each one a stable, unique slug id (so the sidebar can link
// to `#slug`), and returning the HTML with those ids injected alongside the
// flat heading list used to render the TOC.

function slugify(text) {
  const normalized = text
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
  return normalized
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function buildToc(html) {
  if (!html) return { html: html || '', items: [] };

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const headings = Array.from(doc.body.querySelectorAll('h1, h2, h3'));
  const usedIds = new Set();

  const items = headings.map((heading, index) => {
    const text = heading.textContent.trim();
    const baseSlug = slugify(text) || `muc-${index + 1}`;
    let slug = baseSlug;
    let suffix = 2;
    while (usedIds.has(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(slug);
    heading.id = slug;
    return { id: slug, text, level: Number(heading.tagName[1]) };
  });

  return { html: doc.body.innerHTML, items };
}
