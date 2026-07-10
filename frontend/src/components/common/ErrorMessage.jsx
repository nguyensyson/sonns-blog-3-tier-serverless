export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-state">
      <span className="error-state-text">{message}</span>
      {onRetry && (
        <button type="button" className="retry-btn" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  );
}
