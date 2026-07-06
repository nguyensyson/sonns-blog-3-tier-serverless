import { useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useBlog } from '../context/BlogContext';
import { ACCENTS } from '../data/posts';
import { deserializeContent } from '../utils/contentSerializer';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { posts } = useBlog();
  const post = posts.find((p) => p.id === Number(id));

  if (!post) {
    return (
      <div className="detail-screen">
        <div className="detail-wrap">
          <button className="back-link" onClick={() => navigate('/')}>
            ← Quay lại danh sách
          </button>
          <div className="no-results">Không tìm thấy bài viết.</div>
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
          <span className="cover-dot" style={{ background: accent }} />
          <span className="cover-label detail">ẢNH MINH HOẠ</span>
        </div>
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
