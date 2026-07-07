import { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';

export default function KebabMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('mousedown', onClickOutside);
    return () => window.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div className="kebab-menu" ref={ref}>
      <button
        type="button"
        className="kebab-menu-trigger"
        aria-label="Tùy chọn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="kebab-menu-popover">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`kebab-menu-item${item.danger ? ' danger' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onClick();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
