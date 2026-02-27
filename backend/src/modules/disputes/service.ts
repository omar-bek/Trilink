import { DisputeRepository } from './repository';
import {
  CreateDisputeDto,
  UpdateDisputeDto,
  EscalateDisputeDto,
  AddAttachmentDto,
  ResolveDisputeDto,
  AssignDisputeDto,
  DisputeResponse,
} from './types';
import { AppError } from '../../middlewares/error.middleware';
import { IDispute, DisputeStatus } from './schema';
import { ContractRepository } from '../contracts/repository';
import { UserRepository } from '../users/repository';
import { Role } from '../../config/rbac';
import mongoose from 'mongoose';
import { getSocketService } from '../../socket/socket.service';
import { SocketEvent } from '../../socket/types';
import { logger } from '../../utils/logger';
import { notificationService, NotificationEvent } from '../notifications';
import { notificationHelpers } from '../notifications/helpers';
import { PaginatedResponse } from '../../types/common';
import { parsePaginationQuery, createPaginationResult, buildSortObject } from '../../utils/pagination';
import { createAuditLog } from '../../middlewares/audit.middleware';
import { AuditAction, AuditResource } from '../audit/schema';
import { config } from '../../config/env';

export class DisputeService {
  private repository: DisputeRepository;
  private contractRepository: ContractRepository;
  private userRepository: UserRepository;

  constructor() {
    this.repository = new DisputeRepository();
    this.contractRepository = new ContractRepository();
    this.userRepository = new UserRepository();
  }

  /**
   * Create a new dispute
   */
  async createDispute(
    companyId: string,
    userId: string,
    data: CreateDisputeDto
  ): Promise<DisputeResponse> {
    // Verify contract exists
    const contract = await this.contractRepository.findById(data.contractId);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    // Create dispute
    const dispute = await this.repository.create({
      ...data,
      companyId: new mongoose.Types.ObjectId(companyId),
      raisedBy: new mongoose.Types.ObjectId(userId),
      againstCompanyId: new mongoose.Types.ObjectId(data.againstCompanyId),
      contractId: new mongoose.Types.ObjectId(data.contractId),
      attachments: (data.attachments || []).map(att => ({
        ...att,
        uploadedAt: new Date(),
      })),
      status: DisputeStatus.OPEN,
    });

    // Emit socket event for dispute creation
    try {
      const socketService = getSocketService();
      socketService.emitDisputeEvent(
        SocketEvent.DISPUTE_CREATED,
        {
          disputeId: dispute._id.toString(),
          contractId: dispute.contractId.toString(),
          companyId: dispute.companyId.toString(),
          againstCompanyId: dispute.againstCompanyId.toString(),
          type: dispute.type,
          status: dispute.status,
          escalatedToGovernment: dispute.escalatedToGovernment,
        },
        [
          dispute.companyId.toString(), // Company that raised dispute
          dispute.againstCompanyId.toString(), // Company dispute is against
        ]
      );
    } catch (error) {
      logger.error('Failed to emit dispute created socket event:', error);
    }

    // Notify company managers about dispute creation
    try {
      await this.contractRepository.findById(dispute.contractId.toString());
      const disputeUrl = `${config.frontend.url}/disputes/${dispute._id}`;

      // Notify company that raised dispute
      await notificationService.notifyCompanyManagers(
        dispute.companyId.toString(),
        NotificationEvent.DISPUTE_CREATED,
        {
          title: `New Dispute Created`,
          message: `A new dispute has been created for contract. Type: ${dispute.type}, Description: ${dispute.description || 'No description provided'}`,
          entityType: 'dispute',
          entityId: dispute._id.toString(),
          actionUrl: disputeUrl,
          disputeId: dispute._id.toString(),
          contractId: dispute.contractId.toString(),
          type: dispute.type,
          description: dispute.description,
        }
      );

      // Notify company dispute is against
      await notificationService.notifyCompanyManagers(
        dispute.againstCompanyId.toString(),
        NotificationEvent.DISPUTE_CREATED,
        {
          title: `Dispute Filed Against Your Company`,
          message: `A dispute has been filed against your company for a contract. Type: ${dispute.type}, Description: ${dispute.description || 'No description provided'}`,
          entityType: 'dispute',
          entityId: dispute._id.toString(),
          actionUrl: disputeUrl,
          disputeId: dispute._id.toString(),
          contractId: dispute.contractId.toString(),
          type: dispute.type,
          description: dispute.description,
        }
      );
    } catch (error) {
      logger.error('Failed to notify company managers about dispute creation:', error);
    }

    return this.toDisputeResponse(dispute);
  }

  /**
   * Get dispute by ID
   */
  async getDisputeById(id: string): Promise<DisputeResponse> {
    const dispute = await this.repository.findById(id);
    if (!dispute) {
      throw new AppError('Dispute not found', 404);
    }
    return this.toDisputeResponse(dispute);
  }

  /**
   * Get disputes by contract
   */
  async getDisputesByContract(contractId: string): Promise<DisputeResponse[]> {
    const disputes = await this.repository.findByContractId(contractId);
    return disputes.map((dispute) => this.toDisputeResponse(dispute));
  }

  /**
   * Get disputes by company
   */
  async getDisputesByCompany(
    companyId: string,
    filters?: { status?: string; escalated?: boolean }
  ): Promise<DisputeResponse[]> {
    const disputes = await this.repository.findByCompanyId(companyId, {
      status: filters?.status as any,
      escalated: filters?.escalated,
    });
    return disputes.map((dispute) => this.toDisputeResponse(dispute));
  }

  /**
   * Get disputes by company with pagination
   */
  async getDisputesByCompanyPaginated(
    companyId: string,
    filters?: { status?: string; escalated?: boolean },
    paginationQuery?: { page?: string; limit?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<PaginatedResponse<DisputeResponse>> {
    const pagination = parsePaginationQuery(paginationQuery || {});
    const sort = buildSortObject(pagination.sortBy || 'createdAt', pagination.sortOrder);

    const { disputes, total } = await this.repository.findByCompanyIdPaginated(
      companyId,
      {
        status: filters?.status as any,
        escalated: filters?.escalated,
      },
      {
        skip: pagination.skip,
        limit: pagination.limit,
        sortBy: Object.keys(sort)[0],
        sortOrder: Object.values(sort)[0] === 1 ? 'asc' : 'desc',
      }
    );

    return createPaginationResult(
      disputes.map((dispute) => this.toDisputeResponse(dispute)),
      total,
      pagination
    );
  }

  /**
   * Get all disputes (Government only)
   */
  async getAllDisputes(filters?: { status?: string; escalated?: boolean }): Promise<DisputeResponse[]> {
    const disputes = await this.repository.findAll({
      status: filters?.status as DisputeStatus,
      escalated: filters?.escalated,
    });
    return disputes.map((dispute) => this.toDisputeResponse(dispute));
  }

  /**
   * Get escalated disputes (for government)
   */
  async getEscalatedDisputes(): Promise<DisputeResponse[]> {
    const disputes = await this.repository.findEscalatedDisputes();
    return disputes.map((dispute) => this.toDisputeResponse(dispute));
  }

  /**
   * Get disputes assigned to a specific user
   */
  async getDisputesAssignedToMe(userId: string, filters?: { status?: string }): Promise<DisputeResponse[]> {
    const disputes = await this.repository.findByAssignedTo(userId, {
      status: filters?.status as DisputeStatus,
    });
    return disputes.map((dispute) => this.toDisputeResponse(dispute));
  }

  /**
   * Update dispute status
   * Status lifecycle: open → under_review → escalated → resolved
   */
  async updateDispute(id: string, data: UpdateDisputeDto): Promise<DisputeResponse> {
    const dispute = await this.repository.findById(id);
    if (!dispute) {
      throw new AppError('Dispute not found', 404);
    }

    // Status lifecycle validation
    if (data.status && data.status !== dispute.status) {
      const validTransitions: Record<DisputeStatus, DisputeStatus[]> = {
        [DisputeStatus.OPEN]: [DisputeStatus.UNDER_REVIEW],
        [DisputeStatus.UNDER_REVIEW]: [DisputeStatus.ESCALATED, DisputeStatus.RESOLVED],
        [DisputeStatus.ESCALATED]: [DisputeStatus.RESOLVED],
        [DisputeStatus.RESOLVED]: [], // Final state, no transitions
      };

      const allowedTransitions = validTransitions[dispute.status];
      if (!allowedTransitions.includes(data.status as DisputeStatus)) {
        throw new AppError(
          `Invalid status transition: Cannot change from ${dispute.status} to ${data.status}. Valid transitions: ${allowedTransitions.join(', ')}`,
          400
        );
      }
    }

    const beforeData = {
      status: dispute.status,
      resolution: dispute.resolution,
    };

    const updated = await this.repository.update(id, data);
    if (!updated) {
      throw new AppError('Failed to update dispute', 500);
    }

    // Create audit log for status changes
    if (data.status && data.status !== dispute.status) {
      try {
        await createAuditLog(
          dispute.raisedBy.toString(),
          dispute.companyId.toString(),
          AuditAction.UPDATE,
          AuditResource.DISPUTE,
          {
            resourceId: id,
            before: beforeData,
            after: {
              status: updated.status,
              resolution: updated.resolution,
            },
            changes: {
              status: `${beforeData.status} → ${updated.status}`,
            },
          }
        );
      } catch (error) {
        logger.error('Failed to create audit log for dispute status change:', error);
      }
    }

    return this.toDisputeResponse(updated);
  }

  /**
   * Add attachments to dispute
   */
  async addAttachments(id: string, data: AddAttachmentDto): Promise<DisputeResponse> {
    const dispute = await this.repository.findById(id);
    if (!dispute) {
      throw new AppError('Dispute not found', 404);
    }

    // Only allow adding attachments to open or under_review disputes
    if (dispute.status === DisputeStatus.ESCALATED || dispute.status === DisputeStatus.RESOLVED) {
      throw new AppError('Cannot add attachments to escalated or resolved disputes', 400);
    }

    const newAttachments = data.attachments.map((att) => ({
      ...att,
      uploadedAt: new Date(),
    }));

    const updated = await this.repository.addAttachments(id, newAttachments);
    if (!updated) {
      throw new AppError('Failed to add attachments', 500);
    }

    return this.toDisputeResponse(updated);
  }

  /**
   * Escalate dispute to government
   * Status: UNDER_REVIEW → ESCALATED
   */
  async escalateDispute(
    id: string,
    data: EscalateDisputeDto
  ): Promise<DisputeResponse> {
    const dispute = await this.repository.findById(id);
    if (!dispute) {
      throw new AppError('Dispute not found', 404);
    }

    // Status lifecycle: Only UNDER_REVIEW can be escalated
    if (dispute.status !== DisputeStatus.UNDER_REVIEW) {
      throw new AppError(
        `Dispute cannot be escalated in current status: ${dispute.status}. Only under_review disputes can be escalated.`,
        400
      );
    }

    // MANDATORY: Assignment is required when escalating
    if (!data.assignedToUserId) {
      throw new AppError('Assignment is required when escalating a dispute. Please assign to a government user.', 400);
    }

    // Validate assigned user
    const assignedUser = await this.userRepository.findById(data.assignedToUserId);
    if (!assignedUser) {
      throw new AppError('Assigned user not found', 404);
    }
    if (assignedUser.role !== Role.GOVERNMENT && assignedUser.role !== Role.ADMIN) {
      throw new AppError('Assigned user must be a government user', 400);
    }

    const assignedToUserId = new mongoose.Types.ObjectId(data.assignedToUserId);
    const now = new Date();

    // Calculate SLA due date (default: 7 business days from escalation)
    // For simplicity, using 7 calendar days. In production, use business days calculation
    const defaultDueDate = new Date(now);
    defaultDueDate.setDate(defaultDueDate.getDate() + 7);
    const dueDate = data.dueDate || defaultDueDate;

    const updateData: Partial<IDispute> = {
      escalatedToGovernment: true,
      status: DisputeStatus.ESCALATED,
      governmentNotes: data.governmentNotes,
      assignedTo: assignedToUserId,
      assignedAt: now,
      assignedBy: new mongoose.Types.ObjectId(dispute.raisedBy.toString()), // Track who escalated
      dueDate,
    };

    const beforeData = {
      status: dispute.status,
      escalatedToGovernment: dispute.escalatedToGovernment,
      assignedTo: dispute.assignedTo?.toString(),
    };

    const updated = await this.repository.update(id, updateData);

    if (!updated) {
      throw new AppError('Failed to escalate dispute', 500);
    }

    // Create audit log for escalation and assignment
    try {
      await createAuditLog(
        dispute.raisedBy.toString(),
        dispute.companyId.toString(),
        AuditAction.ESCALATE,
        AuditResource.DISPUTE,
        {
          resourceId: id,
          before: beforeData,
          after: {
            status: updated.status,
            escalatedToGovernment: updated.escalatedToGovernment,
            assignedTo: updated.assignedTo?.toString(),
            assignedAt: updated.assignedAt,
            dueDate: updated.dueDate,
          },
          changes: {
            status: `${beforeData.status} → ${updated.status}`,
            assignedTo: updated.assignedTo?.toString(),
            dueDate: updated.dueDate,
          },
        }
      );
    } catch (error) {
      logger.error('Failed to create audit log for dispute escalation:', error);
    }

    // Notify government users via email
    try {
      const governmentRecipients = await notificationHelpers.getGovernmentRecipients();
      
      // If assigned to specific user, prioritize them in notification
      if (assignedToUserId && governmentRecipients.length > 0) {
        const assignedUser = await this.userRepository.findById(assignedToUserId.toString());
        if (assignedUser) {
          const assignedRecipient = {
            email: assignedUser.email,
            name: assignedUser.firstName && assignedUser.lastName
              ? `${assignedUser.firstName} ${assignedUser.lastName}`
              : assignedUser.email,
          };
          
          // Send notification to assigned user first
          await notificationService.sendDisputeEscalationNotification(
            updated,
            [assignedRecipient]
          );
          
          // Also notify other government users
          const otherRecipients = governmentRecipients.filter(
            (r) => r.email !== assignedUser.email
          );
          if (otherRecipients.length > 0) {
            await notificationService.sendDisputeEscalationNotification(
              updated,
              otherRecipients
            );
          }
        }
      } else {
        // Notify all government users
        if (governmentRecipients.length > 0) {
          await notificationService.sendDisputeEscalationNotification(
            updated,
            governmentRecipients
          );
        }
      }
    } catch (error) {
      logger.error('Failed to send dispute escalation email notifications:', error);
    }

    // Emit socket event for dispute escalation
    try {
      const socketService = getSocketService();
      // Get all companies involved in the dispute
      const companyIds = [
        updated.companyId.toString(),
        updated.againstCompanyId.toString(),
      ];
      
      // Also notify government users (they'll be in government company room)
      socketService.emitDisputeEvent(
        SocketEvent.DISPUTE_ESCALATED,
        {
          disputeId: updated._id.toString(),
          contractId: updated.contractId.toString(),
          companyId: updated.companyId.toString(),
          againstCompanyId: updated.againstCompanyId.toString(),
          type: updated.type,
          status: updated.status,
          escalatedToGovernment: true,
          governmentNotes: data.governmentNotes,
          assignedTo: assignedToUserId?.toString(),
        },
        companyIds
      );
      
      // Also emit to government namespace (all government users)
      const disputesNamespace = socketService.getNamespace('disputes');
      if (disputesNamespace) {
        disputesNamespace.emit(SocketEvent.DISPUTE_ESCALATED, {
          event: SocketEvent.DISPUTE_ESCALATED,
          data: {
            disputeId: updated._id.toString(),
            contractId: updated.contractId.toString(),
            companyId: updated.companyId.toString(),
            againstCompanyId: updated.againstCompanyId.toString(),
            type: updated.type,
            status: updated.status,
            escalatedToGovernment: true,
            governmentNotes: data.governmentNotes,
            assignedTo: assignedToUserId?.toString(),
          },
          timestamp: new Date(),
        });
      }
    } catch (error) {
      logger.error('Failed to emit dispute escalated socket event:', error);
    }

    // Notify company managers about dispute escalation
    try {
      await this.contractRepository.findById(updated.contractId.toString());
      const disputeUrl = `${config.frontend.url}/disputes/${updated._id}`;

      // Notify company that raised dispute
      await notificationService.notifyCompanyManagers(
        updated.companyId.toString(),
        NotificationEvent.DISPUTE_ESCALATED,
        {
          title: `Dispute Escalated to Government`,
          message: `Your dispute has been escalated to government for review. ${data.governmentNotes ? `Government notes: ${data.governmentNotes}` : ''}`,
          entityType: 'dispute',
          entityId: updated._id.toString(),
          actionUrl: disputeUrl,
          disputeId: updated._id.toString(),
          contractId: updated.contractId.toString(),
          type: updated.type,
          governmentNotes: data.governmentNotes,
          assignedTo: assignedToUserId?.toString(),
        }
      );

      // Notify company dispute is against
      await notificationService.notifyCompanyManagers(
        updated.againstCompanyId.toString(),
        NotificationEvent.DISPUTE_ESCALATED,
        {
          title: `Dispute Escalated to Government`,
          message: `A dispute against your company has been escalated to government for review. ${data.governmentNotes ? `Government notes: ${data.governmentNotes}` : ''}`,
          entityType: 'dispute',
          entityId: updated._id.toString(),
          actionUrl: disputeUrl,
          disputeId: updated._id.toString(),
          contractId: updated.contractId.toString(),
          type: updated.type,
          governmentNotes: data.governmentNotes,
          assignedTo: assignedToUserId?.toString(),
        }
      );
    } catch (error) {
      logger.error('Failed to notify company managers about dispute escalation:', error);
    }

    return this.toDisputeResponse(updated);
  }

  /**
   * Assign or reassign dispute to a government user
   * Can be used to assign unassigned disputes or reassign existing assignments
   */
  async assignDispute(
    id: string,
    data: AssignDisputeDto,
    assignedByUserId: string
  ): Promise<DisputeResponse> {
    const dispute = await this.repository.findById(id);
    if (!dispute) {
      throw new AppError('Dispute not found', 404);
    }

    // Only escalated disputes can be assigned
    if (!dispute.escalatedToGovernment) {
      throw new AppError('Dispute must be escalated to government before assignment', 400);
    }

    // Validate assigned user
    const assignedUser = await this.userRepository.findById(data.assignedToUserId);
    if (!assignedUser) {
      throw new AppError('Assigned user not found', 404);
    }
    if (assignedUser.role !== Role.GOVERNMENT && assignedUser.role !== Role.ADMIN) {
      throw new AppError('Assigned user must be a government user', 400);
    }

    const assignedToUserId = new mongoose.Types.ObjectId(data.assignedToUserId);
    const now = new Date();

    // Calculate SLA due date if not provided
    const defaultDueDate = new Date(now);
    defaultDueDate.setDate(defaultDueDate.getDate() + 7);
    const dueDate = data.dueDate || defaultDueDate;

    const beforeData = {
      assignedTo: dispute.assignedTo?.toString(),
      assignedAt: dispute.assignedAt,
      dueDate: dispute.dueDate,
    };

    const updateData: Partial<IDispute> = {
      assignedTo: assignedToUserId,
      assignedAt: now,
      assignedBy: new mongoose.Types.ObjectId(assignedByUserId),
      dueDate,
    };

    const updated = await this.repository.update(id, updateData);

    if (!updated) {
      throw new AppError('Failed to assign dispute', 500);
    }

    // Create audit log for assignment
    try {
      await createAuditLog(
        assignedByUserId,
        dispute.companyId.toString(),
        AuditAction.UPDATE,
        AuditResource.DISPUTE,
        {
          resourceId: id,
          before: beforeData,
          after: {
            assignedTo: updated.assignedTo?.toString(),
            assignedAt: updated.assignedAt,
            assignedBy: updated.assignedBy?.toString(),
            dueDate: updated.dueDate,
          },
          changes: {
            assignedTo: `${beforeData.assignedTo || 'unassigned'} → ${updated.assignedTo?.toString()}`,
            assignedAt: updated.assignedAt,
            dueDate: updated.dueDate,
          },
        }
      );
    } catch (error) {
      logger.error('Failed to create audit log for dispute assignment:', error);
    }

    // Notify assigned user
    try {
      const assignedRecipient = {
        email: assignedUser.email,
        name: assignedUser.firstName && assignedUser.lastName
          ? `${assignedUser.firstName} ${assignedUser.lastName}`
          : assignedUser.email,
      };
      await notificationService.sendDisputeEscalationNotification(
        updated,
        [assignedRecipient]
      );
    } catch (error) {
      logger.error('Failed to send assignment notification:', error);
    }

    // Emit socket event for assignment
    try {
      const socketService = getSocketService();
      socketService.emitDisputeEvent(
        SocketEvent.DISPUTE_ESCALATED, // Reuse escalation event for assignment updates
        {
          disputeId: updated._id.toString(),
          contractId: updated.contractId.toString(),
          companyId: updated.companyId.toString(),
          againstCompanyId: updated.againstCompanyId.toString(),
          type: updated.type,
          status: updated.status,
          escalatedToGovernment: true,
          assignedTo: updated.assignedTo?.toString(),
          dueDate: updated.dueDate,
        },
        [updated.companyId.toString(), updated.againstCompanyId.toString()]
      );
    } catch (error) {
      logger.error('Failed to emit dispute assignment socket event:', error);
    }

    return this.toDisputeResponse(updated);
  }

  /**
   * Resolve dispute (Government only)
   * Status: ESCALATED → RESOLVED
   */
  async resolveDispute(
    id: string,
    data: ResolveDisputeDto,
    requesterRole?: Role
  ): Promise<DisputeResponse> {
    const dispute = await this.repository.findById(id);
    if (!dispute) {
      throw new AppError('Dispute not found', 404);
    }

    // Only Government can resolve disputes
    if (requesterRole && requesterRole !== Role.GOVERNMENT && requesterRole !== Role.ADMIN) {
      throw new AppError('Only Government can resolve disputes', 403);
    }

    // Status lifecycle: Only ESCALATED disputes can be resolved
    if (dispute.status !== DisputeStatus.ESCALATED) {
      throw new AppError(
        `Dispute cannot be resolved in current status: ${dispute.status}. Only escalated disputes can be resolved.`,
        400
      );
    }

    // Verify dispute is escalated to government
    if (!dispute.escalatedToGovernment) {
      throw new AppError('Dispute must be escalated to government before resolution', 400);
    }

    const beforeData = {
      status: dispute.status,
      resolution: dispute.resolution,
    };

    // Calculate response time if assigned
    let responseTime: number | undefined;
    if (dispute.assignedAt) {
      const now = new Date();
      const diffMs = now.getTime() - dispute.assignedAt.getTime();
      responseTime = Math.round(diffMs / (1000 * 60 * 60)); // Convert to hours
    }

    const updated = await this.repository.update(id, {
      status: DisputeStatus.RESOLVED,
      resolution: data.resolution,
      responseTime,
    });

    if (!updated) {
      throw new AppError('Failed to resolve dispute', 500);
    }

    // Create audit log for resolution
    try {
      await createAuditLog(
        dispute.assignedTo?.toString() || dispute.raisedBy.toString(),
        dispute.companyId.toString(),
        AuditAction.RESOLVE,
        AuditResource.DISPUTE,
        {
          resourceId: id,
          before: beforeData,
          after: {
            status: updated.status,
            resolution: updated.resolution,
            responseTime: updated.responseTime,
          },
          changes: {
            status: `${beforeData.status} → ${updated.status}`,
            responseTime: updated.responseTime,
          },
        }
      );
    } catch (error) {
      logger.error('Failed to create audit log for dispute resolution:', error);
    }

    return this.toDisputeResponse(updated);
  }

  /**
   * Delete dispute (soft delete)
   */
  async deleteDispute(id: string): Promise<void> {
    const dispute = await this.repository.findById(id);
    if (!dispute) {
      throw new AppError('Dispute not found', 404);
    }

    await this.repository.softDelete(id);
  }

  /**
   * Convert IDispute to DisputeResponse
   */
  private toDisputeResponse(dispute: IDispute): DisputeResponse {
    return {
      id: dispute._id.toString(),
      contractId: dispute.contractId.toString(),
      companyId: dispute.companyId.toString(),
      raisedBy: dispute.raisedBy.toString(),
      againstCompanyId: dispute.againstCompanyId.toString(),
      type: dispute.type,
      description: dispute.description,
      attachments: dispute.attachments,
      status: dispute.status,
      resolution: dispute.resolution,
      escalatedToGovernment: dispute.escalatedToGovernment,
      governmentNotes: dispute.governmentNotes,
      assignedTo: dispute.assignedTo?.toString(),
      assignedAt: dispute.assignedAt,
      assignedBy: dispute.assignedBy?.toString(),
      dueDate: dispute.dueDate,
      responseTime: dispute.responseTime,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
    };
  }
}
