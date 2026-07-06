import { Node, mergeAttributes } from '@tiptap/core';

// Custom block node representing an inline illustration image.
// It renders as a real <img> in the WYSIWYG editor (so the user sees a live
// preview) but is serialized back to a {{imageN.ext}} text placeholder by
// contentSerializer.js before the post content is persisted.
export const PlaceholderImage = Node.create({
  name: 'placeholderImage',

  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      placeholder: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-placeholder'),
        renderHTML: (attributes) => ({ 'data-placeholder': attributes.placeholder }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'img[data-placeholder]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes, { class: 'editor-image' })];
  },

  addCommands() {
    return {
      // Inserts the image together with a trailing empty paragraph so the
      // selection lands as a text cursor after the image (ready to keep
      // typing) instead of a NodeSelection on the image itself — a plain
      // NodeSelection would cause the next keystroke to replace the image.
      setPlaceholderImage:
        (attrs) =>
        ({ chain }) =>
          chain()
            .insertContent([{ type: this.name, attrs }, { type: 'paragraph' }])
            .run(),
    };
  },
});

export default PlaceholderImage;
