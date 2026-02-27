import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { UpdateUserProfileDto, ChangePasswordDto } from '@/types/user';
import { useAuthStore } from '@/store/auth.store';
import { queryKeys, invalidateDetailQuery } from '@/lib/queryKeys';

export const useProfile = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.auth.profile(userId),
    queryFn: () => userService.getUserById(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 403 (permission denied) or 404 (not found)
      if (error?.response?.status === 403 || error?.response?.status === 404) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
  });
};

/**
 * Update profile - uses /users/me for self-update
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserProfileDto }) => {
      // If updating own profile, use /users/me endpoint
      if (user?.id === userId) {
        return userService.updateMyProfile(data);
      }
      // Otherwise use regular update endpoint
      return userService.updateUser(userId, data);
    },
    onSuccess: (response, variables) => {
      // Update auth store with new user data
      const { setUser } = useAuthStore.getState();
      if (user && user.id === variables.userId) {
        setUser({ ...user, ...response.data, role: response.data.role as any });
      }
      // Invalidate profile query
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile(variables.userId) });
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: ChangePasswordDto }) =>
      userService.changePassword(userId, data),
    onError: (error: any) => {
      // Error will be handled in the component
      if (import.meta.env.DEV) {
        console.error('Change password error:', error);
      }
    },
  });
};
