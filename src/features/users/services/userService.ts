import api from '@/lib/api';
import type {
  User,
  RoleStatistic,
  Role,
  CursorPaginatedUsersResponse
} from '../types';
import { useUserStore } from '../stores/userStore';

class UserService {
  /**
   * Fetch a page of users with cursor pagination.
   * Replaces both the load-everything getUsers() and the separate
   * organizationService.searchUsers() — search is server-side here.
   *
   * @param limit Page size (1-100, default 50; backend clamps).
   * @param cursor Base64 cursor from a prior page's next_cursor; omit for first page.
   * @param searchTerm Fuzzy match on name/email/phone (ILIKE).
   * @param role Filter by exact role.
   */
  async getUsersCursor(
    limit: number = 50,
    cursor?: string,
    searchTerm?: string,
    role?: Role
  ): Promise<CursorPaginatedUsersResponse> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (cursor) params.append('cursor', cursor);
    if (searchTerm && searchTerm.trim()) params.append('search', searchTerm.trim());
    if (role) params.append('role', role);

    const { data } = await api.get<CursorPaginatedUsersResponse>(
      `/api/usermanagement/users/cursor?${params.toString()}`
    );
    return data;
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
}

export const userService = new UserService();
