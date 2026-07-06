import { useNavigate } from 'react-router-dom';
import { ACCENTS } from '../data/posts';

export default function PostCard({ post }) {
  const navigate = useNavigate();
  const accent = ACCENTS[post.coverIndex % 2];

  return (
    <button className="post-card" onClick={() => navigate(`/post/${post.id}`)}>
      <div className="post-cover">
        <span className="cover-dot" style={{ background: accent }} />
        <span className="cover-label">ẢNH MINH HOẠ</span>
      </div>
      <div className="post-card-body">
        <div className="post-meta">
          <span className="tag-badge" style={{ color: accent }}>
            <span className="cover-dot small" style={{ background: accent }} />
            {post.tag}
          </span>
          <span className="post-date">{post.date}</span>
        </div>
        <div className="post-card-title">{post.title}</div>
        <div className="post-card-excerpt">{post.excerpt}</div>
        <div className="post-read-time">{post.readTime}</div>
      </div>
    </button>
  );
}
