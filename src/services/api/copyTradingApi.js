import axiosInstance from '../axiosConfig';

const BASE = '/api/v1/copy-trading';

export const copyTradingApi = {
  // Groups
  getGroups: () => axiosInstance.get(`${BASE}/groups`),
  getGroup: (id) => axiosInstance.get(`${BASE}/groups/${id}`),
  createGroup: (data) => axiosInstance.post(`${BASE}/groups`, data),
  updateGroup: (id, data) => axiosInstance.patch(`${BASE}/groups/${id}`, data),
  deleteGroup: (id) => axiosInstance.delete(`${BASE}/groups/${id}`),

  // Activation
  activateGroup: (id) => axiosInstance.post(`${BASE}/groups/${id}/activate`),
  pauseGroup: (id) => axiosInstance.post(`${BASE}/groups/${id}/pause`),

  // Followers
  addFollower: (groupId, data) => axiosInstance.post(`${BASE}/groups/${groupId}/followers`, data),
  updateFollower: (groupId, followerId, data) =>
    axiosInstance.patch(`${BASE}/groups/${groupId}/followers/${followerId}`, data),
  removeFollower: (groupId, followerId) =>
    axiosInstance.delete(`${BASE}/groups/${groupId}/followers/${followerId}`),
};

export default copyTradingApi;
