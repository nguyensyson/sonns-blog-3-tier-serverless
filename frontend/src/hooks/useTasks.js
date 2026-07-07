import { useEffect, useMemo, useState } from 'react';

// Data layer for the Personal Task Manager. Persists to localStorage for the
// demo; swap loadState/persist for real API calls later without touching
// the component tree that consumes this hook.
const STORAGE_KEY = 'personal-task-manager:v1';

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayPlusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  // Build the local calendar date manually — toISOString() converts to UTC
  // first, which silently shifts the date near midnight in most timezones.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function seedState() {
  const groups = [
    { id: 'g-work', name: 'Công việc', order: 0 },
    { id: 'g-personal', name: 'Cá nhân', order: 1 },
  ];
  const tasks = [
    {
      id: uid('t'),
      groupId: 'g-work',
      title: 'Chuẩn bị slide demo sản phẩm',
      description: '',
      dueDate: todayPlusDays(-1),
      isDone: false,
      completedAt: null,
      order: 0,
    },
    {
      id: uid('t'),
      groupId: 'g-work',
      title: 'Review pull request của team',
      description: '',
      dueDate: todayPlusDays(0),
      isDone: false,
      completedAt: null,
      order: 1,
    },
    {
      id: uid('t'),
      groupId: 'g-personal',
      title: 'Đi chợ mua đồ ăn tuần này',
      description: '',
      dueDate: todayPlusDays(3),
      isDone: false,
      completedAt: null,
      order: 0,
    },
    {
      id: uid('t'),
      groupId: 'g-work',
      title: 'Viết báo cáo tuần trước',
      description: '',
      dueDate: todayPlusDays(-3),
      isDone: true,
      completedAt: new Date().toISOString(),
      order: 2,
    },
  ];
  return { groups, tasks };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.groups) && Array.isArray(parsed.tasks)) return parsed;
    }
  } catch {
    // corrupt storage, fall through to seed data
  }
  return seedState();
}

export function useTasks() {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const groups = useMemo(() => [...state.groups].sort((a, b) => a.order - b.order), [state.groups]);

  const activeTaskIdsByGroup = useMemo(() => {
    const map = {};
    groups.forEach((g) => {
      map[g.id] = [];
    });
    state.tasks
      .filter((t) => !t.isDone)
      .sort((a, b) => a.order - b.order)
      .forEach((t) => {
        if (map[t.groupId]) map[t.groupId].push(t.id);
      });
    return map;
  }, [groups, state.tasks]);

  const completedTasks = useMemo(
    () =>
      state.tasks
        .filter((t) => t.isDone)
        .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0)),
    [state.tasks]
  );

  const addGroup = (name) => {
    setState((prev) => ({
      ...prev,
      groups: [...prev.groups, { id: uid('g'), name, order: prev.groups.length }],
    }));
  };

  const renameGroup = (groupId, name) => {
    setState((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === groupId ? { ...g, name } : g)),
    }));
  };

  const deleteGroup = (groupId) => {
    setState((prev) => ({
      groups: prev.groups.filter((g) => g.id !== groupId).map((g, index) => ({ ...g, order: index })),
      tasks: prev.tasks.filter((t) => t.groupId !== groupId),
    }));
  };

  // orderedIds: group ids in their final desired order, produced by the
  // drag-and-drop layer after reordering the group columns.
  const reorderGroups = (orderedIds) => {
    setState((prev) => {
      const positions = Object.fromEntries(orderedIds.map((id, index) => [id, index]));
      return {
        ...prev,
        groups: prev.groups.map((g) => (positions[g.id] !== undefined ? { ...g, order: positions[g.id] } : g)),
      };
    });
  };

  const addTask = (groupId, { title, dueDate }) => {
    setState((prev) => {
      const siblingCount = prev.tasks.filter((t) => t.groupId === groupId && !t.isDone).length;
      const task = {
        id: uid('t'),
        groupId,
        title,
        description: '',
        dueDate: dueDate || '',
        isDone: false,
        completedAt: null,
        order: siblingCount,
      };
      return { ...prev, tasks: [...prev.tasks, task] };
    });
  };

  const updateTask = (taskId, { title, description, dueDate }) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, title, description, dueDate } : t)),
    }));
  };

  const deleteTask = (taskId) => {
    setState((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) }));
  };

  const toggleDone = (taskId) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, isDone: true, completedAt: new Date().toISOString() } : t
      ),
    }));
  };

  const reopenTask = (taskId) => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;
      const siblingCount = prev.tasks.filter(
        (t) => t.groupId === task.groupId && !t.isDone && t.id !== taskId
      ).length;
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, isDone: false, completedAt: null, order: siblingCount } : t
        ),
      };
    });
  };

  // containers: { [groupId]: [taskId, ...] } in final desired order, produced
  // by the drag-and-drop layer after a reorder / cross-group move.
  const applyReorder = (containers) => {
    setState((prev) => {
      const positions = {};
      Object.entries(containers).forEach(([groupId, ids]) => {
        ids.forEach((id, index) => {
          positions[id] = { groupId, order: index };
        });
      });
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          positions[t.id] ? { ...t, groupId: positions[t.id].groupId, order: positions[t.id].order } : t
        ),
      };
    });
  };

  return {
    groups,
    tasks: state.tasks,
    activeTaskIdsByGroup,
    completedTasks,
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
