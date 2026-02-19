import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { Profile } from './Profile';
import { useAuthStore } from '@/store/auth.store';
import { useProfile, useUpdateProfile, useChangePassword } from '@/hooks/useProfile';
import { Role } from '@/types';
import { MemoryRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('@/store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn(),
  useUpdateProfile: vi.fn(),
  useChangePassword: vi.fn(),
}));

describe('Profile', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: Role.BUYER,
    companyId: 'company-1',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockProfileData = {
    data: {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phone: '1234567890',
      role: Role.BUYER,
      companyId: 'company-1',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  };

  const mockUpdateProfile = vi.fn();
  const mockChangePassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      user: mockUser,
    });
    (useProfile as any).mockReturnValue({
      data: mockProfileData,
      isLoading: false,
    });
    (useUpdateProfile as any).mockReturnValue({
      mutateAsync: mockUpdateProfile,
      isPending: false,
    });
    (useChangePassword as any).mockReturnValue({
      mutateAsync: mockChangePassword,
      isPending: false,
    });
  });

  it('should render profile form with user data', () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    (useProfile as any).mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    // Should show loading skeleton (implementation depends on PageSkeleton)
    expect(screen.queryByDisplayValue('Test')).not.toBeInTheDocument();
  });

  it('should update profile when form is submitted', async () => {
    const user = userEvent.setup();
    mockUpdateProfile.mockResolvedValue({ data: mockProfileData });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const firstNameInput = screen.getByLabelText(/first name/i);
    const saveButton = screen.getByRole('button', { name: /save changes/i });

    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Updated');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        userId: '1',
        data: expect.objectContaining({
          firstName: 'Updated',
        }),
      });
    });
  });

  it('should show success message after profile update', async () => {
    const user = userEvent.setup();
    mockUpdateProfile.mockResolvedValue({ data: mockProfileData });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const firstNameInput = screen.getByLabelText(/first name/i);
    const saveButton = screen.getByRole('button', { name: /save changes/i });

    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Updated');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });
  });

  it('should show password form when change password button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
  });

  it('should validate password form - passwords must match', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /change password/i });

    await user.type(currentPasswordInput, 'oldpassword');
    await user.type(newPasswordInput, 'newpassword123');
    await user.type(confirmPasswordInput, 'differentpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords must match/i)).toBeInTheDocument();
    });
  });

  it('should validate password form - minimum length', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /change password/i });

    await user.type(currentPasswordInput, 'oldpassword');
    await user.type(newPasswordInput, 'short');
    await user.type(confirmPasswordInput, 'short');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('should change password successfully', async () => {
    const user = userEvent.setup();
    mockChangePassword.mockResolvedValue({});

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /change password/i });

    await user.type(currentPasswordInput, 'oldpassword');
    await user.type(newPasswordInput, 'newpassword123');
    await user.type(confirmPasswordInput, 'newpassword123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith({
        userId: '1',
        data: {
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        },
      });
    });
  });

  it('should display account information', () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    expect(screen.getByText(/status/i)).toBeInTheDocument();
    expect(screen.getByText(/member since/i)).toBeInTheDocument();
    expect(screen.getByText(/active/i)).toBeInTheDocument();
  });

  it('should disable email and role fields', () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const emailInput = screen.getByDisplayValue('test@example.com');
    const roleInput = screen.getByDisplayValue(Role.BUYER);

    expect(emailInput).toBeDisabled();
    expect(roleInput).toBeDisabled();
  });
});
