import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import { ACCENTS } from '../data/posts';
import RichTextEditor from '../components/RichTextEditor/RichTextEditor';
import { isContentEmpty } from '../utils/contentSerializer';
import { getErrorMessage } from '../api/client';

const EMPTY_FORM = { title: '', tag: '', excerpt: '', content: '', images: {}, coverIndex: 0 };

export default function AdminPage() {
  const { blogPosts, isLoggedIn, addPost, updatePost, deletePost } = useBlog();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isFormOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeForm();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFormOpen]);

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  const updateField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.excerpt.trim() || isContentEmpty(form.content)) return;
    setIsSubmitting(true);
    try {
      if (editingId != null) {
        await updatePost(editingId, form);
      } else {
        await addPost(form);
      }
      closeForm();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (post) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      tag: post.tag,
      excerpt: post.excerpt,
      content: post.content,
      images: post.images || {},
      coverIndex: post.coverIndex,
    });
    setIsFormOpen(true);
  };

  return (
    <div className="admin-screen">
      <div className="admin-list-header">
        <h2 className="admin-list-heading">Tất cả bài viết ({blogPosts.length})</h2>
        <button type="button" className="btn-primary" onClick={openCreateForm}>
          + Tạo bài viết mới
        </button>
      </div>
      <div className="admin-list">
        {blogPosts.map((post) => {
          const accent = ACCENTS[post.coverIndex % 2];
          return (
            <div className="admin-list-item" key={post.id}>
              <span className="cover-dot admin-list-item-dot" style={{ background: accent }} />
              <div className="admin-list-item-info">
                <div className="admin-list-item-title">{post.title}</div>
                <div className="admin-list-item-meta">
                  {post.tag} · {post.date}
                </div>
              </div>
              <button className="admin-list-item-action edit" onClick={() => startEdit(post)}>
                Sửa
              </button>
              <button
                className="admin-list-item-action delete"
                onClick={() => deletePost(post.id, 'blog').catch((err) => window.alert(getErrorMessage(err)))}
              >
                Xóa
              </button>
            </div>
          );
        })}
      </div>

      {isFormOpen && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-card admin-form-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="admin-form-heading">{editingId != null ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}</h2>
              <button type="button" className="modal-close-btn" onClick={closeForm} aria-label="Đóng">
                ✕
              </button>
            </div>
            <form className="form-col" onSubmit={handleSubmit}>
              <input
                className="admin-text-input"
                placeholder="Tiêu đề bài viết"
                value={form.title}
                onChange={updateField('title')}
              />
              <input
                className="admin-text-input"
                placeholder="Tag (VD: AWS, DevOps...)"
                value={form.tag}
                onChange={updateField('tag')}
              />
              <textarea
                className="admin-textarea"
                placeholder="Mô tả ngắn"
                rows={2}
                value={form.excerpt}
                onChange={updateField('excerpt')}
              />
              <RichTextEditor
                key={editingId ?? 'new'}
                content={form.content}
                images={form.images}
                onChange={({ content, images }) => setForm((f) => ({ ...f, content, images }))}
              />
              <div>
                <div className="cover-picker-label">Màu ảnh bìa</div>
                <div className="cover-picker-options">
                  {[0, 1].map((i) => {
                    const accent = ACCENTS[i];
                    const selected = form.coverIndex === i;
                    return (
                      <button
                        type="button"
                        key={i}
                        className={`cover-option${selected ? ' selected' : ''}`}
                        style={{ borderColor: selected ? accent : undefined, color: selected ? accent : undefined }}
                        onClick={() => setForm((f) => ({ ...f, coverIndex: i }))}
                      >
                        {i === 0 ? 'Xanh lá' : 'Vàng'}
                      </button>
                    );
                  })}
                </div>
              </div>
              {error && <div className="form-error">{error}</div>}
              <div className="admin-form-actions">
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang lưu...' : editingId != null ? 'Cập nhật bài viết' : 'Đăng bài viết'}
                </button>
                <button type="button" className="cancel-btn" onClick={closeForm}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
