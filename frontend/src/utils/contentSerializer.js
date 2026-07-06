// Bridges the rich-text editor's HTML representation and the persisted post
// content format: an HTML string where illustration images are represented
// as {{imageN.ext}} text placeholders instead of <img> tags, plus a separate
// `images` map of placeholder name -> image source (base64 data URL today,
// an S3 URL once real uploads are wired up).
//
// Keeping placeholders inside the stored HTML (rather than storing raw
// base64 inline) means the "content" string stays small and readable, and
// swapping a placeholder's image source later (e.g. after an S3 upload)
// never requires touching the content string itself.

const IMG_TAG_REGEX = /<img[^>]*data-placeholder="([^"]+)"[^>]*>/g;
const PLACEHOLDER_REGEX = /\{\{([^{}]+)\}\}/g;
const PLACEHOLDER_INDEX_REGEX = /^image(\d+)\.[a-zA-Z0-9]+$/;

// editor HTML (with real <img data-placeholder="..."> tags) -> storable string
export function serializeContent(html) {
  if (!html) return '';
  return html.replace(IMG_TAG_REGEX, (_match, placeholder) => `{{${placeholder}}}`);
}

// storable string + images map -> HTML with real <img> tags.
// Used both to seed the editor when opening it (editable images) and to
// render the public PostDetail view (display-only images).
export function deserializeContent(content, images = {}, { imgClassName = 'editor-image' } = {}) {
  if (!content) return '';
  return content.replace(PLACEHOLDER_REGEX, (match, placeholder) => {
    const src = images[placeholder];
    if (!src) return match;
    const safePlaceholder = escapeAttribute(placeholder);
    return `<img src="${escapeAttribute(src)}" data-placeholder="${safePlaceholder}" alt="${safePlaceholder}" class="${imgClassName}">`;
  });
}

// Scans a serialized content string for {{imageN.ext}} placeholders and
// returns the next free index, so newly uploaded images keep increasing
// numbering (image1.png, image2.png, ...) instead of colliding.
export function getNextImageIndex(content) {
  let max = 0;
  if (content) {
    for (const match of content.matchAll(PLACEHOLDER_REGEX)) {
      const indexMatch = PLACEHOLDER_INDEX_REGEX.exec(match[1]);
      if (indexMatch) max = Math.max(max, Number(indexMatch[1]));
    }
  }
  return max + 1;
}

// True when a serialized content string has no visible text and no image
// placeholders (e.g. the editor's default empty "<p></p>" document).
export function isContentEmpty(content) {
  if (!content) return true;
  return content.replace(/<[^>]*>/g, '').trim().length === 0;
}

function escapeAttribute(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
