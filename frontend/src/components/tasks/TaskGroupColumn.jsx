import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ListChecks, Plus, X } from 'lucide-react';
import TaskCard from './TaskCard';
import { gradientFor } from '../../utils/taskGroupColors';

export default function TaskGroupColumn({
  group,
  taskIds,
  tasksById,
  onRenameGroup,
  onDeleteGroup,
  onAddTask,
  onToggleDone,
  onEditTask,
  onDeleteTask,
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const [isAdding, setIsAdding] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDueDate, setQuickDueDate] = useState('');
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: group.id });
  const {
    setNodeRef: setSortRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id, data: { type: 'group' } });

  const columnStyle = { transform: CSS.Transform.toString(transform), transition };

  const commitRename = () => {
    const trimmed = nameDraft.trim();
    if (trimmed) onRenameGroup(group.id, trimmed);
    else setNameDraft(group.name);
    setIsRenaming(false);
  };

  const submitQuickAdd = (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onAddTask(group.id, { title: quickTitle.trim(), dueDate: quickDueDate });
    setQuickTitle('');
    setQuickDueDate('');
    setIsAdding(false);
  };

  return (
    <div
      ref={setSortRef}
      style={columnStyle}
      className={`task-group-column${isDragging ? ' task-group-dragging' : ''}`}
    >
      <div
        className="task-group-cover"
        style={group.coverImageUrl ? { backgroundImage: `url(${group.coverImageUrl})` } : { background: gradientFor(group.id) }}
      />
      <div className="task-group-card-body">
        <div className="task-group-header">
          <button
            type="button"
            className="task-group-drag-handle"
            aria-label="Kéo để sắp xếp group"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={15} />
          </button>
          {isRenaming ? (
            <input
              className="task-group-name-input"
              value={nameDraft}
              autoFocus
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') {
                  setNameDraft(group.name);
                  setIsRenaming(false);
                }
              }}
            />
          ) : (
            <h3 className="task-group-name" onClick={() => setIsRenaming(true)} title="Click để đổi tên">
              {group.name}
            </h3>
          )}
          <span className="task-group-count">
            <ListChecks size={12} /> {taskIds.length}
          </span>
          <button
            type="button"
            className="task-group-delete-btn"
            aria-label="Xoá group"
            onClick={() => onDeleteGroup(group)}
          >
            <X size={15} />
          </button>
        </div>

        {group.description && (
          <p
            className={`task-group-description${isDescExpanded ? ' expanded' : ''}`}
            title={group.description}
            onClick={() => setIsDescExpanded((v) => !v)}
          >
            {group.description}
          </p>
        )}

        <div className={`task-group-list${isOver ? ' drag-over' : ''}`} ref={setDropRef}>
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {taskIds.length === 0 && (
              <div className="task-group-empty">Chưa có task nào, thêm task đầu tiên nhé.</div>
            )}
            {taskIds.map((id) => (
              <TaskCard
                key={id}
                task={tasksById[id]}
                onToggleDone={onToggleDone}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </SortableContext>
        </div>

        {isAdding ? (
          <form className="task-quick-add" onSubmit={submitQuickAdd}>
            <input
              className="admin-text-input"
              placeholder="Tên task..."
              value={quickTitle}
              autoFocus
              onChange={(e) => setQuickTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsAdding(false);
              }}
            />
            <input
              type="date"
              className="admin-text-input task-quick-add-date"
              value={quickDueDate}
              onChange={(e) => setQuickDueDate(e.target.value)}
            />
            <div className="task-quick-add-actions">
              <button type="submit" className="submit-btn">
                Thêm
              </button>
              <button type="button" className="cancel-btn" onClick={() => setIsAdding(false)}>
                Hủy
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="task-add-btn" onClick={() => setIsAdding(true)}>
            <Plus size={15} /> Thêm task
          </button>
        )}
      </div>
    </div>
  );
}
