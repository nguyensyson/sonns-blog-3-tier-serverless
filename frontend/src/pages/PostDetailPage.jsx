import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { postsApi } from '../api/posts';
import { getErrorMessage } from '../api/client';
import { ACCENTS } from '../data/posts';
import { deserializeContent } from '../utils/contentSerializer';
import { buildToc } from '../utils/toc';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeHeadingId, setActiveHeadingId] = useState('');
  const contentRef = useRef(null);

  useEffect(() => {
    setIsLoading(true);
    setError('');
    postsApi
      .getBlog(id)
      .then((res) => setPost(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [id]);

  const { html: renderedHtml, items: tocItems } = useMemo(() => {
    if (!post) return { html: '', items: [] };
    const sanitized = DOMPurify.sanitize(
      deserializeContent(post.content, post.images || {}, { imgClassName: 'detail-image' }),
      { ADD_ATTR: ['target'] }
    );
    return buildToc(sanitized);
  }, [post]);

  useEffect(() => {
    if (!tocItems.length || !contentRef.current) return;
    const headingEls = tocItems
      .map((item) => contentRef.current.querySelector(`#${CSS.escape(item.id)}`))
      .filter(Boolean);
    if (!headingEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        setActiveHeadingId(topMost.target.id);
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 }
    );
    headingEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [tocItems, renderedHtml]);

  const handleTocClick = (e, headingId) => {
    e.preventDefault();
    const el = document.getElementById(headingId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveHeadingId(headingId);
    window.history.replaceState(null, '', `#${headingId}`);
  };

  if (isLoading) {
    return (
      <div className="detail-screen">
        <div className="detail-wrap">
          <div className="no-results">Đang tải bài viết...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="detail-screen">
        <div className="detail-wrap">
          <button className="back-link" onClick={() => navigate('/')}>
            ← Quay lại danh sách
          </button>
          <div className="no-results">{error || 'Không tìm thấy bài viết.'}</div>
        </div>
      </div>
    );
  }

  const accent = ACCENTS[post.coverIndex % 2];
  const hasToc = tocItems.length > 0;

  const renderTocList = () => (
    <ul className="detail-toc-list">
      {tocItems.map((item) => (
        <li key={item.id} className={`detail-toc-item level-${item.level}`}>
          <a
            href={`#${item.id}`}
            className={activeHeadingId === item.id ? 'active' : ''}
            onClick={(e) => handleTocClick(e, item.id)}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="detail-screen">
      <div className={`detail-wrap${hasToc ? ' has-toc' : ''}`}>
        {hasToc && (
          <aside className="detail-toc">
            <div className="detail-toc-title">Mục lục</div>
            <nav aria-label="Mục lục bài viết">{renderTocList()}</nav>
          </aside>
        )}
        <div className="detail-main">
          <button className="back-link" onClick={() => navigate('/')}>
            ← Quay lại danh sách
          </button>

          {hasToc && (
            <details className="detail-toc-mobile">
              <summary>Mục lục</summary>
              {renderTocList()}
            </details>
          )}

          <div className="detail-meta">
            <span className="tag-badge" style={{ color: accent }}>
              <span className="cover-dot small" style={{ background: accent }} />
              {post.tag}
            </span>
            <span className="post-date">{post.date}</span>
            <span className="post-date">·</span>
            <span className="post-date">{post.readTime}</span>
          </div>
          <h1 className="detail-title">{post.title}</h1>
          <div className="post-cover detail-cover">
            {post.coverImageUrl ? (
              <img className="post-cover-img" src={post.coverImageUrl} alt={post.title} />
            ) : (
              <>
                <span className="cover-dot" style={{ background: accent }} />
                <span className="cover-label detail">ẢNH MINH HOẠ</span>
              </>
            )}
          </div>
          {post.resources && post.resources.length > 0 && (
            <div className="resource-download-list">
              {post.resources.map((res) => (
                <a
                  className="resource-download-banner"
                  key={res.url}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={res.name || undefined}
                >
                  <span className="resource-download-icon" aria-hidden="true">
                    ⬇
                  </span>
                  <span className="resource-download-text">
                    Tải tài nguyên đính kèm{res.name ? `: ${res.name}` : ''}
                  </span>
                </a>
              ))}
            </div>
          )}
          <div
            ref={contentRef}
            className="detail-rich-content"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>
      </div>
    </div>
  );
}
