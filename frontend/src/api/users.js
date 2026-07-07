import { apiClient } from './client';

export function getMe() {
  return apiClient.get('/users/me');
}
