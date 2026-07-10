export default function Spinner({ label = 'Đang tải...' }) {
  return (
    <div className="loading-state">
      <span className="spinner" aria-hidden="true" />
      {label && <span className="loading-label">{label}</span>}
    </div>
  );
}
