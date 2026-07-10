import { useRef, useState } from 'react';

const DEFAULT_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;

export default function ImageDropzone({
  value,
  onChange,
  onError,
  accept = DEFAULT_ACCEPT,
  maxSizeBytes = DEFAULT_MAX_SIZE,
}) {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateAndRead = (file) => {
    if (!file) return;
    if (!accept.includes(file.type)) {
      onError?.('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.');
      return;
    }
    if (file.size > maxSizeBytes) {
      onError?.(`Dung lượng ảnh không được vượt quá ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    validateAndRead(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    validateAndRead(e.dataTransfer.files?.[0]);
  };

  if (value) {
    return (
      <div className="image-dropzone image-dropzone-preview">
        <img src={value} alt="Xem trước ảnh cover" />
        <button type="button" className="cover-image-remove" onClick={() => onChange(null)} aria-label="Xóa ảnh">
          ✕
        </button>
        <label className="cover-image-upload-btn image-dropzone-replace-btn">
          Đổi ảnh khác
          <input type="file" accept={accept.join(',')} style={{ display: 'none' }} onChange={handleInputChange} />
        </label>
      </div>
    );
  }

  return (
    <div
      className={`image-dropzone image-dropzone-empty${isDragOver ? ' drag-over' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <span className="image-dropzone-hint">Click hoặc kéo thả ảnh vào đây</span>
      <span className="image-dropzone-subhint">JPG, PNG, WEBP · tối đa 5MB</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(',')}
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />
    </div>
  );
}
