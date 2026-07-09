import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import { ACCENTS } from '../data/posts';
import RichTextEditor from '../components/RichTextEditor/RichTextEditor';
import { deserializeContent, isContentEmpty } from '../utils/contentSerializer';
import { buildToc } from '../utils/toc';
import { getErrorMessage } from '../api/client';

const EMPTY_FORM = {
  title: '',
  tag: '',
  excerpt: '',
  content: '',
  images: {},
  coverIndex: 0,
  coverImageUrl: '',
  resources: [],
  resourceFiles: [],
};
const ACCEPTED_COVER_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const ACCEPTED_RESOURCE_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.pdf', '.zip', '.doc', '.docx', '.txt', '.json'];

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

  const tocPreview = useMemo(
    () => buildToc(deserializeContent(form.content, form.images || {})).items,
    [form.content, form.images]
  );

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  const updateField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCoverImagePicked = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ACCEPTED_COVER_TYPES.includes(file.type)) {
      window.alert('Chỉ hỗ trợ ảnh JPG, PNG, GIF hoặc WEBP.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, coverImageUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleResourceFilesPicked = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const valid = [];
    const rejected = [];
    files.forEach((file) => {
      const ext = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
      (ACCEPTED_RESOURCE_EXTENSIONS.includes(ext) ? valid : rejected).push(file);
    });
    if (rejected.length) {
      window.alert('Chỉ hỗ trợ CSV, XLSX, XLS, PDF, ZIP, DOC, DOCX, TXT hoặc JSON.');
    }
    if (valid.length) {
      setForm((f) => ({ ...f, resourceFiles: [...f.resourceFiles, ...valid] }));
    }
  };

  const removePersistedResource = (index) => {
    setForm((f) => ({ ...f, resources: f.resources.filter((_, i) => i !== index) }));
  };

  const removePendingResourceFile = (index) => {
    setForm((f) => ({ ...f, resourceFiles: f.resourceFiles.filter((_, i) => i !== index) }));
  };

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
      coverImageUrl: post.coverImageUrl || '',
      resources: post.resources || [],
      resourceFiles: [],
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
              {tocPreview.length > 0 && (
                <div className="admin-toc-preview">
                  <div className="admin-toc-preview-title">Xem trước mục lục</div>
                  <ul className="admin-toc-preview-list">
                    {tocPreview.map((item) => (
                      <li key={item.id} className={`level-${item.level}`}>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <div className="cover-picker-label">Ảnh minh hoạ bài viết</div>
                <div className="cover-image-picker">
                  {form.coverImageUrl && (
                    <div className="cover-image-preview">
                      <img src={form.coverImageUrl} alt="Xem trước ảnh bìa" />
                      <button
                        type="button"
                        className="cover-image-remove"
                        onClick={() => setForm((f) => ({ ...f, coverImageUrl: '' }))}
                        aria-label="Xóa ảnh bìa"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <label className="cover-image-upload-btn">
                    {form.coverImageUrl ? 'Đổi ảnh khác' : '+ Tải ảnh lên'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      style={{ display: 'none' }}
                      onChange={handleCoverImagePicked}
                    />
                  </label>
                </div>
              </div>
              <div>
                <div className="cover-picker-label">Tệp tài nguyên đính kèm (CSV, XLSX, PDF, ZIP, DOCX...)</div>
                <div className="resource-file-list">
                  {form.resources.map((res, i) => (
                    <div className="resource-file-preview" key={`saved-${res.url}`}>
                      <span className="resource-file-name">{res.name}</span>
                      <button
                        type="button"
                        className="resource-file-remove"
                        onClick={() => removePersistedResource(i)}
                        aria-label="Xóa tệp tài nguyên"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {form.resourceFiles.map((file, i) => (
                    <div className="resource-file-preview pending" key={`pending-${i}`}>
                      <span className="resource-file-name">{file.name}</span>
                      <button
                        type="button"
                        className="resource-file-remove"
                        onClick={() => removePendingResourceFile(i)}
                        aria-label="Xóa tệp tài nguyên"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <label className="cover-image-upload-btn resource-upload-btn">
                  + Tải tệp lên
                  <input
                    type="file"
                    multiple
                    accept={ACCEPTED_RESOURCE_EXTENSIONS.join(',')}
                    style={{ display: 'none' }}
                    onChange={handleResourceFilesPicked}
                  />
                </label>
              </div>
              <div>
                <div className="cover-picker-label">Màu ảnh bìa (dùng khi chưa có ảnh)</div>
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
