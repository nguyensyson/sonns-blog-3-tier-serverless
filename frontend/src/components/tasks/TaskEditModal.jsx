import { useEffect, useState } from 'react';

export default function TaskEditModal({ task, onSave, onClose }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(task.id, { title: title.trim(), description: description.trim(), dueDate });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card admin-form-card task-edit-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="admin-form-heading">Sửa task</h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        <form className="form-col" onSubmit={handleSubmit}>
          <input
            className="admin-text-input"
            placeholder="Tên task"
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="admin-textarea"
            placeholder="Mô tả (tuỳ chọn)"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input type="date" className="admin-text-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <div className="admin-form-actions">
            <button type="submit" className="submit-btn">
              Lưu thay đổi
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
