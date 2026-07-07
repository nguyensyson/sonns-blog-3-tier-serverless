import { apiClient } from './client';

export const tasksApi = {
  listGroups: () => apiClient.get('/groups'),
  createGroup: (name) => apiClient.post('/groups', { name }),
  renameGroup: (groupId, name) => apiClient.put(`/groups/${groupId}`, { name }),
  deleteGroup: (groupId) => apiClient.delete(`/groups/${groupId}`),
  reorderGroups: (orderedGroupIds) => apiClient.put('/groups/reorder', { orderedGroupIds }),

  createTask: (groupId, { title, description, dueDate }) =>
    apiClient.post(`/groups/${groupId}/tasks`, { title, description, dueDate }),
  updateTask: (taskId, { title, description, dueDate }) =>
    apiClient.put(`/tasks/${taskId}`, { title, description, dueDate }),
  moveTask: (taskId, { groupId, order }) => apiClient.put(`/tasks/${taskId}/move`, { groupId, order }),
  completeTask: (taskId) => apiClient.put(`/tasks/${taskId}/complete`),
  reopenTask: (taskId) => apiClient.put(`/tasks/${taskId}/reopen`),
  deleteTask: (taskId) => apiClient.delete(`/tasks/${taskId}`),
};
