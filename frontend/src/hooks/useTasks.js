import { useCallback, useEffect, useMemo, useState } from 'react';
import { tasksApi } from '../api/tasks';

function mapTask(task) {
  return {
    id: task.taskId,
    groupId: task.groupId,
    title: task.title,
    description: task.description || '',
    dueDate: task.dueDate || '',
    isDone: task.isDone,
    completedAt: task.completedAt,
    order: task.order,
  };
}

function mapGroup(group) {
  return {
    id: group.groupId,
    name: group.name,
    order: group.order,
    tasks: (group.tasks || []).map(mapTask),
  };
}

// `enabled` gates all requests behind login state - the /groups and /tasks
// endpoints require auth, so this must stay idle until the caller is logged in.
export function useTasks(enabled) {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    const res = await tasksApi.listGroups();
    setGroups(res.data.map(mapGroup));
  }, []);

  useEffect(() => {
    if (!enabled) {
      setGroups([]);
      return;
    }
    setIsLoading(true);
    refresh().finally(() => setIsLoading(false));
  }, [enabled, refresh]);

  const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.order - b.order), [groups]);

  const tasks = useMemo(() => sortedGroups.flatMap((g) => g.tasks), [sortedGroups]);

  const activeTaskIdsByGroup = useMemo(() => {
    const map = {};
    sortedGroups.forEach((g) => {
      map[g.id] = g.tasks
        .filter((t) => !t.isDone)
        .sort((a, b) => a.order - b.order)
        .map((t) => t.id);
    });
    return map;
  }, [sortedGroups]);

  const completedTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.isDone)
        .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0)),
    [tasks]
  );

  const addGroup = (name) => tasksApi.createGroup(name).then(refresh);

  const renameGroup = (groupId, name) => tasksApi.renameGroup(groupId, name).then(refresh);

  const deleteGroup = (groupId) => tasksApi.deleteGroup(groupId).then(refresh);

  const reorderGroups = (orderedIds) => tasksApi.reorderGroups(orderedIds).then(refresh);

  const addTask = (groupId, { title, dueDate }) =>
    tasksApi.createTask(groupId, { title, description: '', dueDate }).then(refresh);

  const updateTask = (taskId, { title, description, dueDate }) =>
    tasksApi.updateTask(taskId, { title, description, dueDate }).then(refresh);

  const deleteTask = (taskId) => tasksApi.deleteTask(taskId).then(refresh);

  const toggleDone = (taskId) => tasksApi.completeTask(taskId).then(refresh);

  const reopenTask = (taskId) => tasksApi.reopenTask(taskId).then(refresh);

  // containers: { [groupId]: [taskId, ...] } in final desired order, produced
  // by the drag-and-drop layer after a reorder / cross-group move. Persists
  // every active task's (groupId, order) so the backend matches the UI.
  const applyReorder = (containers) => {
    const moves = Object.entries(containers).flatMap(([groupId, ids]) =>
      ids.map((taskId, order) => ({ taskId, groupId, order }))
    );
    return Promise.all(moves.map(({ taskId, groupId, order }) => tasksApi.moveTask(taskId, { groupId, order }))).then(
      refresh
    );
  };

  return {
    groups: sortedGroups,
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
  };
}
