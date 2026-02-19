import { EmailRecipient } from './types';
import { UserRepository } from '../users/repository';
import { CompanyRepository } from '../companies/repository';
import { Role } from '../../config/rbac';
import { Status } from '../../types/common';

/**
 * Helper functions for notification recipients
 */
export class NotificationHelpers {
  private userRepository: UserRepository;
  private companyRepository: CompanyRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.companyRepository = new CompanyRepository();
  }

  /**
   * Get email recipients from company ID
   */
  async getRecipientsByCompany(
    companyId: string,
    roles?: Role[]
  ): Promise<EmailRecipient[]> {
    const filters: { role?: Role; status?: Status } = {
      status: Status.ACTIVE,
    };

    const users = await this.userRepository.findByCompanyId(companyId, filters);
    
    // Filter by roles if provided
    const filteredUsers = roles
      ? users.filter((user) => roles.includes(user.role as Role))
      : users;

    return filteredUsers.map((user) => ({
      email: user.email,
      name: user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email,
    }));
  }

  /**
   * Get email recipients by role (across all companies)
   */
  async getRecipientsByRole(role: Role): Promise<EmailRecipient[]> {
    const users = await this.userRepository.findByRole(role, { status: Status.ACTIVE });
    
    return users.map((user) => ({
      email: user.email,
      name: user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email,
    }));
  }

  /**
   * Get government users for dispute escalation
   */
  async getGovernmentRecipients(): Promise<EmailRecipient[]> {
    return this.getRecipientsByRole(Role.GOVERNMENT);
  }

  /**
   * Get company managers for a specific company
   */
  async getCompanyManagers(companyId: string): Promise<EmailRecipient[]> {
    return this.getRecipientsByCompany(companyId, [Role.COMPANY_MANAGER]);
  }

  /**
   * Get company manager user IDs for in-app notifications
   */
  async getCompanyManagerUserIds(companyId: string): Promise<string[]> {
    const filters: { role?: Role; status?: Status } = {
      status: Status.ACTIVE,
      role: Role.COMPANY_MANAGER,
    };

    const users = await this.userRepository.findByCompanyId(companyId, filters);
    return users.map((user) => user._id.toString());
  }

  /**
   * Get all active users from a company (for notifications)
   */
  async getCompanyUserIds(companyId: string, roles?: Role[]): Promise<string[]> {
    const filters: { role?: Role; status?: Status } = {
      status: Status.ACTIVE,
    };

    const users = await this.userRepository.findByCompanyId(companyId, filters);
    
    const filteredUsers = roles
      ? users.filter((user) => roles.includes(user.role as Role))
      : users;

    return filteredUsers.map((user) => user._id.toString());
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Format datetime
   */
  formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

export const notificationHelpers = new NotificationHelpers();
