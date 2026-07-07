export default function ConfirmDialog({ title, message, confirmLabel = 'Xoá', onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card admin-form-card confirm-dialog-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="admin-form-heading">{title}</h2>
        <p className="confirm-dialog-message">{message}</p>
        <div className="admin-form-actions">
          <button type="button" className="submit-btn danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
