import { useMemo, useState } from 'react';
import { useBlog } from '../context/BlogContext';
import PostCard from '../components/PostCard';
import TagFilter from '../components/TagFilter';

export default function HomePage() {
  const { blogPosts: posts } = useBlog();
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('Tất cả');

  const tags = useMemo(() => ['Tất cả', ...Array.from(new Set(posts.map((p) => p.tag)))], [posts]);

  const filteredPosts = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return posts.filter((p) => {
      const matchesTag = activeTag === 'Tất cả' || p.tag === activeTag;
      const matchesSearch =
        !searchLower ||
        p.title.toLowerCase().includes(searchLower) ||
        p.excerpt.toLowerCase().includes(searchLower);
      return matchesTag && matchesSearch;
    });
  }, [posts, search, activeTag]);

  return (
    <div className="home-screen">
      <div className="home-badge">
        <span className="home-badge-dot" />
        Ghi chép về Cloud &amp; DevOps
      </div>
      <h1 className="home-title">
        Nhật ký kỹ thuật của <span className="accent">Sơn</span>
      </h1>
      <p className="home-subtitle">
        Bài viết về hạ tầng AWS, CI/CD, Kubernetes và những gì mình học được khi vận hành hệ thống hằng ngày.
      </p>

      <input
        className="search-input"
        placeholder="Tìm bài viết theo tiêu đề, mô tả..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <TagFilter tags={tags} activeTag={activeTag} onSelect={setActiveTag} />

      {filteredPosts.length === 0 ? (
        <div className="no-results">Không tìm thấy bài viết phù hợp.</div>
      ) : (
        <div className="post-grid">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
