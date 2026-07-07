import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, SortableContext } from '@dnd-kit/sortable';
import { useBlog } from '../context/BlogContext';
import { useTasks } from '../hooks/useTasks';
import TaskGroupColumn from '../components/tasks/TaskGroupColumn';
import CompletedTasksPanel from '../components/tasks/CompletedTasksPanel';
import TaskEditModal from '../components/tasks/TaskEditModal';
import ConfirmDialog from '../components/tasks/ConfirmDialog';
import { formatDisplayDate } from '../utils/taskDate';
import { getErrorMessage } from '../api/client';

function findContainer(containers, id) {
  if (id in containers) return id;
  return Object.keys(containers).find((key) => containers[key].includes(id));
}

// Every task mutation goes to the backend now, so failures (network, auth,
// ownership) need surfacing instead of failing silently.
function reportError(promise) {
  promise.catch((err) => window.alert(getErrorMessage(err)));
  return promise;
}

export default function TasksPage() {
  const { isLoggedIn } = useBlog();
  const {
    groups,
    tasks,
    activeTaskIdsByGroup,
    completedTasks,
    isLoading,
    addGroup,
    renameGroup,
    deleteGroup,
    reorderGroups,
    addTask,
    updateTask,
    deleteTask,
    toggleDone,
    reopenTask,
    applyReorder,
  } = useTasks(isLoggedIn);

  const [containers, setContainers] = useState(activeTaskIdsByGroup);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [deletingGroup, setDeletingGroup] = useState(null);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const tasksById = useMemo(() => Object.fromEntries(tasks.map((t) => [t.id, t])), [tasks]);
  const groupsById = useMemo(() => Object.fromEntries(groups.map((g) => [g.id, g])), [groups]);
  const liveContainers = isDragging ? containers : activeTaskIdsByGroup;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  const handleDragStart = (event) => {
    if (event.active.data.current?.type === 'group') return;
    setContainers(activeTaskIdsByGroup);
    setActiveTask(tasksById[event.active.id] || null);
    setIsDragging(true);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || active.data.current?.type === 'group') return;
    const activeContainer = findContainer(containers, active.id);
    const overContainer = findContainer(containers, over.id);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setContainers((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.indexOf(active.id);
      const overIndex = overItems.indexOf(over.id);
      const newIndex = overIndex >= 0 ? overIndex : overItems.length;
      return {
        ...prev,
        [activeContainer]: activeItems.filter((id) => id !== active.id),
        [overContainer]: [...overItems.slice(0, newIndex), active.id, ...overItems.slice(newIndex)],
      };
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.data.current?.type === 'group') {
      if (over && active.id !== over.id) {
        const groupIds = groups.map((g) => g.id);
        const overGroupId = over.data.current?.type === 'group' ? over.id : over.data.current?.groupId;
        const oldIndex = groupIds.indexOf(active.id);
        const newIndex = groupIds.indexOf(overGroupId);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          reportError(reorderGroups(arrayMove(groupIds, oldIndex, newIndex)));
        }
      }
      return;
    }

    setIsDragging(false);
    setActiveTask(null);
    if (!over) return;

    let finalContainers = containers;
    const activeContainer = findContainer(containers, active.id);
    const overContainer = findContainer(containers, over.id);

    if (activeContainer && overContainer && activeContainer === overContainer) {
      const items = containers[activeContainer];
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        finalContainers = { ...containers, [activeContainer]: arrayMove(items, oldIndex, newIndex) };
      }
    }
    setContainers(finalContainers);
    reportError(applyReorder(finalContainers));
  };

  const submitNewGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    reportError(addGroup(newGroupName.trim()));
    setNewGroupName('');
    setIsAddingGroup(false);
  };

  const confirmDeleteForever = () => {
    if (deletingTask) reportError(deleteTask(deletingTask.id));
    setDeletingTask(null);
  };

  const confirmDeleteGroup = () => {
    if (deletingGroup) reportError(deleteGroup(deletingGroup.id));
    setDeletingGroup(null);
  };

  return (
    <div className="tasks-screen">
      <div className="tasks-header">
        <h1 className="tasks-title">Việc cần làm của tôi</h1>
        {isAddingGroup ? (
          <form className="task-group-add-form" onSubmit={submitNewGroup}>
            <input
              className="admin-text-input"
              placeholder="Tên group..."
              value={newGroupName}
              autoFocus
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsAddingGroup(false);
              }}
            />
            <button type="submit" className="submit-btn">
              Tạo
            </button>
            <button type="button" className="cancel-btn" onClick={() => setIsAddingGroup(false)}>
              Hủy
            </button>
          </form>
        ) : (
          <button type="button" className="btn-primary" onClick={() => setIsAddingGroup(true)}>
            <Plus size={16} /> Tạo Group mới
          </button>
        )}
      </div>

      {isLoading && <div className="no-results">Đang tải...</div>}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={groups.map((g) => g.id)} strategy={rectSortingStrategy}>
          <div className="task-groups-row">
            {groups.map((group) => (
              <TaskGroupColumn
                key={group.id}
                group={group}
                taskIds={liveContainers[group.id] || []}
                tasksById={tasksById}
                onRenameGroup={(groupId, name) => reportError(renameGroup(groupId, name))}
                onDeleteGroup={setDeletingGroup}
                onAddTask={(groupId, payload) => reportError(addTask(groupId, payload))}
                onToggleDone={(taskId) => reportError(toggleDone(taskId))}
                onEditTask={setEditingTask}
                onDeleteTask={(taskId) => reportError(deleteTask(taskId))}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeTask ? (
            <div className="task-card task-card-overlay">
              <span className="task-checkbox-box" />
              <div className="task-card-body">
                <div className="task-card-title">{activeTask.title}</div>
                {activeTask.dueDate && <div className="task-due-date">{formatDisplayDate(activeTask.dueDate)}</div>}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CompletedTasksPanel
        tasks={completedTasks}
        groupsById={groupsById}
        onReopen={(taskId) => reportError(reopenTask(taskId))}
        onDeleteForever={setDeletingTask}
      />

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={(id, payload) => {
            reportError(updateTask(id, payload));
            setEditingTask(null);
          }}
        />
      )}

      {deletingTask && (
        <ConfirmDialog
          title="Xoá task vĩnh viễn?"
          message={`Task "${deletingTask.title}" sẽ bị xoá hoàn toàn và không thể khôi phục.`}
          confirmLabel="Xoá vĩnh viễn"
          onConfirm={confirmDeleteForever}
          onCancel={() => setDeletingTask(null)}
        />
      )}

      {deletingGroup && (
        <ConfirmDialog
          title="Xoá group?"
          message={`Group "${deletingGroup.name}" và toàn bộ task bên trong (kể cả đã hoàn thành) sẽ bị xoá vĩnh viễn.`}
          confirmLabel="Xoá group"
          onConfirm={confirmDeleteGroup}
          onCancel={() => setDeletingGroup(null)}
        />
      )}
    </div>
  );
}
