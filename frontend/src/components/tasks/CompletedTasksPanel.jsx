import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import KebabMenu from './KebabMenu';

export default function CompletedTasksPanel({ tasks, groupsById, onReopen, onDeleteForever }) {
  const [collapsed, setCollapsed] = useState(() => tasks.length > 5);

  return (
    <div className="completed-tasks-panel">
      <button type="button" className="completed-tasks-toggle" onClick={() => setCollapsed((v) => !v)}>
        {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        Đã hoàn thành ({tasks.length})
      </button>
      {!collapsed && (
        <div className="completed-tasks-list">
          {tasks.length === 0 ? (
            <div className="no-results">Chưa có task nào hoàn thành.</div>
          ) : (
            tasks.map((task) => (
              <div className="completed-task-row" key={task.id}>
                <div className="completed-task-info">
                  <span className="completed-task-title">{task.title}</span>
                  {groupsById[task.groupId] && (
                    <span className="completed-task-badge">{groupsById[task.groupId].name}</span>
                  )}
                </div>
                <KebabMenu
                  items={[
                    { label: 'Mở lại task', onClick: () => onReopen(task.id) },
                    { label: 'Xoá vĩnh viễn', onClick: () => onDeleteForever(task), danger: true },
                  ]}
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
