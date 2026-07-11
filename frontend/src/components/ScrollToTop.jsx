import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

const SHOW_THRESHOLD = 300;

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Toggle visibility once the user scrolls past the threshold
    const onScroll = () => setVisible(window.scrollY > SHOW_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      className={`scroll-to-top ${visible ? 'is-visible' : ''}`}
      onClick={handleClick}
      aria-label="Cuộn lên đầu trang"
      tabIndex={visible ? 0 : -1}
    >
      <ArrowUp size={20} strokeWidth={2.5} />
    </button>
  );
}
