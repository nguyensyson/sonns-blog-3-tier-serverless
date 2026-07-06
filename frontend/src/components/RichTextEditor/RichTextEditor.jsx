import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { useRef } from 'react';
import Toolbar from './Toolbar';
import { PlaceholderImage } from './extensions/placeholderImage';
import { deserializeContent, serializeContent, getNextImageIndex } from '../../utils/contentSerializer';

const MIME_EXTENSION = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
};

// Uncontrolled rich text editor: `content` + `images` seed the editor once on
// mount (use a `key` prop from the parent to force a remount when switching
// between "create new post" and "edit post X"). Every change — typing or
// inserting an image — calls `onChange({ content, images })` with the full
// serialized state so the parent form can keep it in sync for submission.
export default function RichTextEditor({ content = '', images = {}, onChange }) {
  const imagesRef = useRef({ ...images });
  const nextIndexRef = useRef(getNextImageIndex(content));

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      TextStyle,
      Color,
      FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      PlaceholderImage,
    ],
    content: deserializeContent(content, imagesRef.current),
    onUpdate: ({ editor: currentEditor }) => {
      onChange({
        content: serializeContent(currentEditor.getHTML()),
        images: imagesRef.current,
      });
    },
  });

  const handleInsertImage = (file) => {
    if (!editor) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ext = MIME_EXTENSION[file.type] || 'png';
      const placeholder = `image${nextIndexRef.current}.${ext}`;
      nextIndexRef.current += 1;
      const src = reader.result;
      imagesRef.current = { ...imagesRef.current, [placeholder]: src };
      editor.chain().focus().setPlaceholderImage({ src, placeholder, alt: placeholder }).run();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rte-wrap">
      <Toolbar editor={editor} onInsertImage={handleInsertImage} />
      <EditorContent className="rte-content" editor={editor} />
    </div>
  );
}
