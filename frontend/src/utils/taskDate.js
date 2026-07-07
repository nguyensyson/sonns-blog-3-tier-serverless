export function formatDisplayDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// 'overdue' | 'soon' (today or tomorrow) | 'normal' | 'none'
export function getDueDateStatus(iso) {
  if (!iso) return 'none';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${iso}T00:00:00`);
  const diffDays = Math.round((due - today) / 86400000);
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 1) return 'soon';
  return 'normal';
}
