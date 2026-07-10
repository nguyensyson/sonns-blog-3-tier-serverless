import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import { ACCENTS } from '../data/posts';
import { getErrorMessage } from '../api/client';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';

const EMPTY_FORM = { title: '', tag: '', excerpt: '', date: '', coverIndex: 0, content: '', images: {} };

export default function JournalPage() {
  const {
    journalEntries,
    isJournalLoading,
    journalError,
    retryLoadJournalEntries,
    isLoggedIn,
    addPost,
    updatePost,
    deletePost,
  } = useBlog();
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

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setForm({
      title: entry.title,
      tag: entry.tag,
      excerpt: entry.excerpt,
      date: entry.date,
      coverIndex: entry.coverIndex,
      content: entry.content || '',
      images: entry.images || {},
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.excerpt.trim()) return;
    const payload = { ...form, category: 'journal' };
    setIsSubmitting(true);
    try {
      if (editingId != null) {
        await updatePost(editingId, payload);
      } else {
        await addPost(payload);
      }
      closeForm();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="journal-screen">
      <div className="journal-header">
        <div>
          <h1 className="journal-title">Nhật ký cá nhân</h1>
          <p className="journal-subtitle">Chỉ mình bạn thấy được trang này.</p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreateForm}>
          + Thêm mục nhật ký
        </button>
      </div>

      {isJournalLoading ? (
        <Spinner label="Đang tải nhật ký..." />
      ) : journalError ? (
        <ErrorMessage message={journalError} onRetry={retryLoadJournalEntries} />
      ) : journalEntries.length === 0 ? (
        <div className="no-results">Chưa có mục nhật ký nào.</div>
      ) : (
        <div className="timeline fade-in">
          {journalEntries.map((entry) => {
            const accent = ACCENTS[entry.coverIndex % 2];
            return (
              <div className="timeline-item" key={entry.id}>
                <span className="timeline-dot" style={{ borderColor: accent }} />
                <div className="timeline-item-top">
                  <div className="timeline-period" style={{ color: accent }}>
                    {entry.date}
                  </div>
                  <div className="timeline-item-actions">
                    <button className="admin-list-item-action edit" onClick={() => startEdit(entry)}>
                      Sửa
                    </button>
                    <button
                      className="admin-list-item-action delete"
                      onClick={() => deletePost(entry.id, 'journal').catch((err) => window.alert(getErrorMessage(err)))}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
                <div className="timeline-title">{entry.title}</div>
                {entry.tag && <div className="timeline-subtitle">{entry.tag}</div>}
                <p className="timeline-desc">{entry.excerpt}</p>
              </div>
            );
          })}
        </div>
      )}

      {isFormOpen && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-card admin-form-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="admin-form-heading">{editingId != null ? 'Chỉnh sửa mục nhật ký' : 'Thêm mục nhật ký'}</h2>
              <button type="button" className="modal-close-btn" onClick={closeForm} aria-label="Đóng">
                ✕
              </button>
            </div>
            <form className="form-col" onSubmit={handleSubmit}>
              <input
                className="admin-text-input"
                placeholder="Tiêu đề (VD: Cloud Engineer Intern)"
                value={form.title}
                onChange={updateField('title')}
              />
              <input
                className="admin-text-input"
                placeholder="Tổ chức / vai trò (VD: AWS Study Group)"
                value={form.tag}
                onChange={updateField('tag')}
              />
              <input
                className="admin-text-input"
                placeholder="Thời gian (VD: Sep 2025 — Hiện tại)"
                value={form.date}
                onChange={updateField('date')}
              />
              <textarea
                className="admin-textarea"
                placeholder="Nội dung nhật ký"
                rows={5}
                value={form.excerpt}
                onChange={updateField('excerpt')}
              />
              <div>
                <div className="cover-picker-label">Màu chấm mốc thời gian</div>
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
                  {isSubmitting ? 'Đang lưu...' : editingId != null ? 'Cập nhật' : 'Lưu mục nhật ký'}
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
