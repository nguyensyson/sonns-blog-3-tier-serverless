// Minimal hand-drawn stroke icon set (no external icon library dependency)
// used by the RichTextEditor toolbar. Every icon shares the same 24x24
// viewBox / stroke conventions so they line up regardless of which ones a
// given toolbar build includes.

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function BoldIcon() {
  return (
    <svg {...base}>
      <path d="M6 4h7a3.5 3.5 0 0 1 0 7H6z" />
      <path d="M6 11h8a3.5 3.5 0 0 1 0 7H6z" />
    </svg>
  );
}

export function ItalicIcon() {
  return (
    <svg {...base}>
      <line x1="10" y1="4" x2="18" y2="4" />
      <line x1="6" y1="20" x2="14" y2="20" />
      <line x1="14" y1="4" x2="10" y2="20" />
    </svg>
  );
}

export function UnderlineIcon() {
  return (
    <svg {...base}>
      <path d="M6 3v7a6 6 0 0 0 12 0V3" />
      <line x1="5" y1="21" x2="19" y2="21" />
    </svg>
  );
}

export function StrikeIcon() {
  return (
    <svg {...base}>
      <line x1="4" y1="12" x2="20" y2="12" />
      <path d="M16 6.5C15.3 5 13.9 4 12 4c-2.5 0-4.5 1.3-4.5 3.5 0 1.6 1 2.6 2.7 3.1" />
      <path d="M8 17.5c.7 1.5 2.1 2.5 4 2.5 2.5 0 4.5-1.3 4.5-3.5 0-1.6-1-2.6-2.7-3.1" />
    </svg>
  );
}

export function UndoIcon() {
  return (
    <svg {...base}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  );
}

export function RedoIcon() {
  return (
    <svg {...base}>
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
    </svg>
  );
}

export function BulletListIcon() {
  return (
    <svg {...base}>
      <circle cx="4.5" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1.2" fill="currentColor" stroke="none" />
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
    </svg>
  );
}

export function OrderedListIcon() {
  return (
    <svg {...base}>
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <text x="2" y="8" fontSize="7" fill="currentColor" stroke="none">1</text>
      <text x="2" y="14" fontSize="7" fill="currentColor" stroke="none">2</text>
      <text x="2" y="20" fontSize="7" fill="currentColor" stroke="none">3</text>
    </svg>
  );
}

export function AlignLeftIcon() {
  return (
    <svg {...base}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="14" y2="12" />
      <line x1="4" y1="18" x2="17" y2="18" />
    </svg>
  );
}

export function AlignCenterIcon() {
  return (
    <svg {...base}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="5.5" y1="18" x2="18.5" y2="18" />
    </svg>
  );
}

export function AlignRightIcon() {
  return (
    <svg {...base}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="10" y1="12" x2="20" y2="12" />
      <line x1="7" y1="18" x2="20" y2="18" />
    </svg>
  );
}

export function AlignJustifyIcon() {
  return (
    <svg {...base}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

export function LinkIcon() {
  return (
    <svg {...base}>
      <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
      <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
    </svg>
  );
}

export function ImageIcon() {
  return (
    <svg {...base}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.6" fill="currentColor" stroke="none" />
      <path d="m5 17 5-5 3.5 3.5L18 11l3 3" />
    </svg>
  );
}

export function PaletteIcon() {
  return (
    <svg {...base}>
      <path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-1 2-2 0-.6-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.3 0-1 .8-1.8 1.8-1.8H16a4 4 0 0 0 4-4c0-4.4-3.6-7.5-8-7.5Z" />
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="16.2" cy="10.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function HighlightIcon() {
  return (
    <svg {...base}>
      <path d="m14.5 3.5-9 9L4 17l4.5-1.5 9-9Z" />
      <line x1="3" y1="21" x2="12" y2="21" />
    </svg>
  );
}
