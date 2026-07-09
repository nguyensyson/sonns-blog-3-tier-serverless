import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { postsApi } from '../api/posts';
import { getErrorMessage } from '../api/client';
import { ACCENTS } from '../data/posts';
import { deserializeContent } from '../utils/contentSerializer';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setError('');
    postsApi
      .getBlog(id)
      .then((res) => setPost(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [id]);

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

  return (
    <div className="detail-screen">
      <div className="detail-wrap">
        <button className="back-link" onClick={() => navigate('/')}>
          ← Quay lại danh sách
        </button>
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
        {post.resourceUrl && (
          <a
            className="resource-download-banner"
            href={post.resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={post.resourceName || undefined}
          >
            <span className="resource-download-icon" aria-hidden="true">
              ⬇
            </span>
            <span className="resource-download-text">
              Tải tài nguyên đính kèm{post.resourceName ? `: ${post.resourceName}` : ''}
            </span>
          </a>
        )}
        <div
          className="detail-rich-content"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              deserializeContent(post.content, post.images || {}, { imgClassName: 'detail-image' }),
              { ADD_ATTR: ['target'] }
            ),
          }}
        />
      </div>
    </div>
  );
}
