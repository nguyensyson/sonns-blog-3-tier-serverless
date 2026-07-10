import { useEffect, useState } from 'react';
import { postsApi } from '../../api/posts';
import { getErrorMessage } from '../../api/client';
import { dataUrlToFile } from '../../utils/dataUrl';
import ImageDropzone from './ImageDropzone';

const DESCRIPTION_MAX_LENGTH = 200;

async function resolveCoverImage(coverDataUrl) {
  if (!coverDataUrl) return null;
  const file = dataUrlToFile(coverDataUrl, 'group-cover');
  const res = await postsApi.uploadImage(file);
  return res.data.url;
}

export default function GroupFormModal({ onCreate, onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverDataUrl, setCoverDataUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      const coverImageUrl = await resolveCoverImage(coverDataUrl);
      await onCreate({ name: name.trim(), description: description.trim(), coverImageUrl });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card admin-form-card group-form-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="admin-form-heading">Tạo Group mới</h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        <form className="form-col" onSubmit={handleSubmit}>
          <div>
            <div className="cover-picker-label">Ảnh cover (tuỳ chọn)</div>
            <ImageDropzone value={coverDataUrl} onChange={setCoverDataUrl} onError={setError} />
          </div>
          <input
            className="admin-text-input"
            placeholder="Tên group"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
          />
          <div>
            <textarea
              className="admin-textarea"
              placeholder="Mô tả group (tuỳ chọn)"
              rows={3}
              maxLength={DESCRIPTION_MAX_LENGTH}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="char-counter">{DESCRIPTION_MAX_LENGTH - description.length} ký tự còn lại</div>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="admin-form-actions">
            <button type="submit" className="submit-btn" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? 'Đang tạo...' : 'Tạo group'}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
