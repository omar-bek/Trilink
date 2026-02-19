import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { CreateUserDto, UpdateUserDto } from '@/types/user';
import { useAuthStore } from '@/store/auth.store';

const queryKeys = {
  all: ['users'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (companyId: string) => [...queryKeys.lists(), companyId] as const,
  allUsers: (filters?: { role?: string; status?: string }) => [...queryKeys.lists(), 'all', filters] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (id: string) => [...queryKeys.details(), id] as const,
};

/**
 * Get all users (admin only)
 */
export const useAllUsers = (
  filters?: { role?: string; status?: string },
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.allUsers(filters),
    queryFn: () => userService.getAllUsers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false, // Default to true, but can be disabled
  });
};

/**
 * Get users by company
 */
export const useUsersByCompany = (companyId: string | undefined) => {
  const { user } = useAuthStore();
  const effectiveCompanyId = companyId || user?.companyId;

  return useQuery({
    queryKey: queryKeys.list(effectiveCompanyId || ''),
    queryFn: () => userService.getUsersByCompany(effectiveCompanyId!),
    enabled: !!effectiveCompanyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get user by ID
 */
export const useUser = (userId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.detail(userId || ''),
    queryFn: () => userService.getUserById(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Create user mutation
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (data: CreateUserDto) => userService.createUser(data),
    onSuccess: () => {
      // Invalidate users list for the company
      if (user?.companyId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.list(user.companyId) });
      }
      // Also invalidate all lists
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      // Invalidate all users list for admin
      queryClient.invalidateQueries({ queryKey: queryKeys.allUsers() });
    },
  });
};

/**
 * Update user mutation
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserDto }) =>
      userService.updateUser(userId, data),
    onSuccess: (_, variables) => {
      // Invalidate specific user
      queryClient.invalidateQueries({ queryKey: queryKeys.detail(variables.userId) });
      // Invalidate users list
      if (user?.companyId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.list(user.companyId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      // Invalidate all users list for admin
      queryClient.invalidateQueries({ queryKey: queryKeys.allUsers() });
    },
  });
};

/**
 * Delete user mutation
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (userId: string) => userService.deleteUser(userId),
    onSuccess: () => {
      // Invalidate users list
      if (user?.companyId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.list(user.companyId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      // Invalidate all users list for admin
      queryClient.invalidateQueries({ queryKey: queryKeys.allUsers() });
    },
  });
};

/**
 * Update my profile mutation (self-update)
 */
export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (data: UpdateUserDto) => userService.updateMyProfile(data),
    onSuccess: (_, variables) => {
      // Invalidate current user profile
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.detail(user.id) });
      }
      // Update auth store user data
      if (user) {
        useAuthStore.setState({
          user: {
            ...user,
            ...variables,
          },
        });
      }
    },
  });
};

/**
 * Update user permissions mutation
 */
export const useUpdateUserPermissions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({ userId, customPermissions }: { userId: string; customPermissions: string[] }) =>
      userService.updateUserPermissions(userId, customPermissions),
    onSuccess: (_, variables) => {
      // Invalidate specific user
      queryClient.invalidateQueries({ queryKey: queryKeys.detail(variables.userId) });
      // Invalidate users list
      if (user?.companyId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.list(user.companyId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      // Invalidate all users list for admin
      queryClient.invalidateQueries({ queryKey: queryKeys.allUsers() });
    },
  });
};
