import { useRef } from 'react';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikeIcon,
  UndoIcon,
  RedoIcon,
  BulletListIcon,
  OrderedListIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignJustifyIcon,
  LinkIcon,
  ImageIcon,
  PaletteIcon,
  HighlightIcon,
} from './icons';

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif'];

function ToolbarButton({ active, disabled, onClick, title, children }) {
  return (
    <button
      type="button"
      className={`rte-btn${active ? ' active' : ''}`}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  );
}

export default function Toolbar({ editor, onInsertImage }) {
  const fileInputRef = useRef(null);

  if (!editor) return null;

  const headingValue = [1, 2, 3].find((level) => editor.isActive('heading', { level })) || 'p';

  const setHeading = (value) => {
    if (value === 'p') editor.chain().focus().setParagraph().run();
    else editor.chain().focus().toggleHeading({ level: Number(value) }).run();
  };

  const setFontSize = (value) => {
    if (!value) editor.chain().focus().unsetFontSize().run();
    else editor.chain().focus().setFontSize(value).run();
  };

  const setLink = () => {
    const previous = editor.getAttributes('link').href;
    const url = window.prompt('Nhập URL liên kết:', previous || 'https://');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const handleFilePicked = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      window.alert('Chỉ hỗ trợ ảnh JPG, PNG hoặc GIF.');
      return;
    }
    onInsertImage(file);
  };

  return (
    <div className="rte-toolbar">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif"
        style={{ display: 'none' }}
        onChange={handleFilePicked}
      />

      <ToolbarButton title="Hoàn tác" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <UndoIcon />
      </ToolbarButton>
      <ToolbarButton title="Làm lại" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <RedoIcon />
      </ToolbarButton>

      <span className="rte-sep" />

      <select className="rte-select" title="Kiểu đoạn" value={headingValue} onChange={(e) => setHeading(e.target.value)}>
        <option value="p">Đoạn văn</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
      </select>

      <select
        className="rte-select"
        title="Cỡ chữ"
        defaultValue=""
        onChange={(e) => setFontSize(e.target.value)}
      >
        <option value="">Cỡ chữ</option>
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>
            {size.replace('px', '')}
          </option>
        ))}
      </select>

      <span className="rte-sep" />

      <ToolbarButton title="In đậm" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <BoldIcon />
      </ToolbarButton>
      <ToolbarButton title="In nghiêng" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <ItalicIcon />
      </ToolbarButton>
      <ToolbarButton title="Gạch chân" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon />
      </ToolbarButton>
      <ToolbarButton title="Gạch ngang" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <StrikeIcon />
      </ToolbarButton>

      <span className="rte-sep" />

      <label className="rte-color-btn" title="Màu chữ">
        <PaletteIcon />
        <input
          type="color"
          onInput={(e) => editor.chain().focus().setColor(e.target.value).run()}
        />
      </label>
      <label className="rte-color-btn" title="Màu nền chữ (highlight)">
        <HighlightIcon />
        <input
          type="color"
          onInput={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
        />
      </label>

      <span className="rte-sep" />

      <ToolbarButton title="Căn trái" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
        <AlignLeftIcon />
      </ToolbarButton>
      <ToolbarButton title="Căn giữa" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
        <AlignCenterIcon />
      </ToolbarButton>
      <ToolbarButton title="Căn phải" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
        <AlignRightIcon />
      </ToolbarButton>
      <ToolbarButton title="Căn đều" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
        <AlignJustifyIcon />
      </ToolbarButton>

      <span className="rte-sep" />

      <ToolbarButton title="Danh sách gạch đầu dòng" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <BulletListIcon />
      </ToolbarButton>
      <ToolbarButton title="Danh sách đánh số" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <OrderedListIcon />
      </ToolbarButton>

      <span className="rte-sep" />

      <ToolbarButton title="Chèn liên kết" active={editor.isActive('link')} onClick={setLink}>
        <LinkIcon />
      </ToolbarButton>
      <ToolbarButton title="Chèn ảnh minh hoạ" onClick={() => fileInputRef.current?.click()}>
        <ImageIcon />
      </ToolbarButton>
    </div>
  );
}
