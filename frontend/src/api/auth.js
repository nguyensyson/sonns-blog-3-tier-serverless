import { apiClient } from './client';

export function login(email, password) {
  return apiClient.post('/auth/login', { email, password });
}
