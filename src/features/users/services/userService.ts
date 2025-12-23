import api from '@/lib/api';
import type { User, RoleStatistic, Role, UserApiResponse, RoleStatisticsApiResponse } from '../types';
import { useUserStore } from '../stores/userStore';

class UserService {
  /**
   * Fetch all users from the backend
   */
  async getUsers(): Promise<User[]> {
    try {
      // Backend returns array directly (not wrapped in success/data)
      const { data } = await api.get<User[]>('/api/usermanagement/users');

      useUserStore.getState().setUsers(data);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      useUserStore.getState().setError(errorMessage);
      throw error;
    }
  }

  /**
   * Fetch users filtered by role
   */
  async getUsersByRole(role: Role): Promise<User[]> {
    try {
      const { data } = await api.get<User[]>(`/api/usermanagement/users/by-role/${role}`);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users by role';
      useUserStore.getState().setError(errorMessage);
      throw error;
    }
  }

  /**
   * Fetch role statistics (count of users per role)
   */
  async getRoleStatistics(): Promise<RoleStatistic[]> {
    try {
      const { data } = await api.get<RoleStatistic[]>('/api/usermanagement/roles/statistics');
      useUserStore.getState().setRoleStatistics(data);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch role statistics';
      useUserStore.getState().setError(errorMessage);
      throw error;
    }
  }

  /**
   * Get a single user by ID from API (Admin only)
   */
  async getUserByIdFromApi(id: string): Promise<User> {
    try {
      const { data } = await api.get<User>(`/api/usermanagement/users/${id}`);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user';
      useUserStore.getState().setError(errorMessage);
      throw error;
    }
  }

  /**
   * Get a single user by ID (using local store)
   */
  getUserById(id: string): User | undefined {
    const { users } = useUserStore.getState();
    return users.find((user) => user.id === id);
  }
}

export const userService = new UserService();
