import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle token refresh automatically on 401
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        return api(originalRequest);
      } catch (refreshErr) {
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      }
    }

    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// ── API Domain Helper Methods ─────────────────────────────

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  getMe: () => api.get('/auth/me'),
};

export const workspaceAPI = {
  getAll: () => api.get('/workspaces'),
  create: (data) => api.post('/workspaces', data),
  getById: (id) => api.get(`/workspaces/${id}`),
  update: (id, data) => api.patch(`/workspaces/${id}`, data),
  delete: (id) => api.delete(`/workspaces/${id}`),
  getMembers: (id) => api.get(`/workspaces/${id}/members`),
  inviteMember: (id, data) => api.post(`/workspaces/${id}/members`, data),
  updateRole: (id, userId, role) => api.patch(`/workspaces/${id}/members/${userId}`, { role }),
  removeMember: (id, userId) => api.delete(`/workspaces/${id}/members/${userId}`),
};

export const projectAPI = {
  getAll: (workspaceId) => api.get('/projects', { params: { workspaceId } }),
  create: (data) => api.post('/projects', data),
  getById: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getMembers: (id) => api.get(`/projects/${id}/members`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
};

export const issueAPI = {
  getByProject: (projectId, params) => api.get(`/projects/${projectId}/issues`, { params }),
  getKanban: (projectId) => api.get(`/projects/${projectId}/kanban`),
  create: (projectId, data) => api.post(`/projects/${projectId}/issues`, data),
  getById: (id) => api.get(`/issues/${id}`),
  update: (id, data) => api.patch(`/issues/${id}`, data),
  delete: (id) => api.delete(`/issues/${id}`),
};

export const commentAPI = {
  getByIssue: (issueId) => api.get(`/issues/${issueId}/comments`),
  create: (issueId, body) => api.post(`/issues/${issueId}/comments`, { body }),
  update: (id, body) => api.patch(`/comments/${id}`, { body }),
  delete: (id) => api.delete(`/comments/${id}`),
};

export const githubAPI = {
  getRepositories: () => api.get('/github/repositories'),
  connectRepo: (repositoryId, projectId) => api.post('/github/repositories/connect', { repositoryId, projectId }),
  disconnectRepo: (id) => api.delete(`/github/repositories/${id}`),
  getCommits: (id, params) => api.get(`/github/repositories/${id}/commits`, { params }),
  getPullRequests: (id, params) => api.get(`/github/repositories/${id}/pulls`, { params }),
  getBranches: (id) => api.get(`/github/repositories/${id}/branches`),
};

export const monitorAPI = {
  getAll: (params) => api.get('/monitors', { params }),
  create: (data) => api.post('/monitors', data),
  getById: (id) => api.get(`/monitors/${id}`),
  update: (id, data) => api.patch(`/monitors/${id}`, data),
  toggle: (id) => api.patch(`/monitors/${id}/toggle`),
  delete: (id) => api.delete(`/monitors/${id}`),
  getChecks: (id, params) => api.get(`/monitors/${id}/checks`, { params }),
  getIncidents: (id, params) => api.get(`/monitors/${id}/incidents`, { params }),
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const analyticsAPI = {
  getProject: (id) => api.get(`/analytics/project/${id}`),
  getMonitoring: (id) => api.get(`/analytics/monitoring/${id}`),
};

export const activityAPI = {
  getByProject: (projectId, params) => api.get(`/activity/project/${projectId}`, { params }),
};

export default api;
