import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar } from 'lucide-react';
import KebabMenu from './KebabMenu';
import { formatDisplayDate, getDueDateStatus } from '../../utils/taskDate';

export default function TaskCard({ task, onToggleDone, onEdit, onDelete }) {
  const [isCompleting, setIsCompleting] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { groupId: task.groupId },
  });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const dueStatus = getDueDateStatus(task.dueDate);

  const handleToggle = () => {
    setIsCompleting(true);
    setTimeout(() => onToggleDone(task.id), 200);
  };

  const className = ['task-card', isDragging && 'task-card-placeholder', isCompleting && 'completing']
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={setNodeRef} style={style} className={className} {...attributes} {...listeners}>
      <label className="task-checkbox" onPointerDown={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={task.isDone} disabled={isCompleting} onChange={handleToggle} />
        <span className="task-checkbox-box" />
      </label>
      <div className="task-card-body">
        <div className="task-card-title">{task.title}</div>
        {task.dueDate && (
          <div className={`task-due-date due-${dueStatus}`}>
            <Calendar size={13} />
            {formatDisplayDate(task.dueDate)}
          </div>
        )}
      </div>
      <div onPointerDown={(e) => e.stopPropagation()}>
        <KebabMenu
          items={[
            { label: 'Sửa task', onClick: () => onEdit(task) },
            { label: 'Xoá task', onClick: () => onDelete(task.id), danger: true },
          ]}
        />
      </div>
    </div>
  );
}
