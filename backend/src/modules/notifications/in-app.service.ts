import { Notification, INotification, NotificationType } from './schema';
import { AppError } from '../../middlewares/error.middleware';
import mongoose from 'mongoose';

export interface CreateNotificationDto {
    userId: string | mongoose.Types.ObjectId;
    companyId: string | mongoose.Types.ObjectId;
    title: string;
    message?: string;
    type?: NotificationType;
    entityType?: 'rfq' | 'bid' | 'contract' | 'dispute' | 'payment' | 'shipment';
    entityId?: string | mongoose.Types.ObjectId;
    actionUrl?: string;
    metadata?: Record<string, any>;
}

export interface NotificationResponse {
    _id: string;
    userId: string;
    companyId: string;
    title: string;
    message?: string;
    type: NotificationType;
    read: boolean;
    readAt?: Date;
    entityType?: string;
    entityId?: string;
    actionUrl?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export class InAppNotificationService {
    /**
     * Create a new notification
     */
    async createNotification(data: CreateNotificationDto): Promise<NotificationResponse> {
        const notification = new Notification({
            userId: data.userId,
            companyId: data.companyId,
            title: data.title,
            message: data.message,
            type: data.type || NotificationType.INFO,
            entityType: data.entityType,
            entityId: data.entityId,
            actionUrl: data.actionUrl,
            metadata: data.metadata,
        });

        await notification.save();
        return this.toResponse(notification);
    }

    /**
     * Create notifications for multiple users
     */
    async createNotificationsForUsers(
        userIds: (string | mongoose.Types.ObjectId)[],
        companyId: string | mongoose.Types.ObjectId,
        data: Omit<CreateNotificationDto, 'userId' | 'companyId'>
    ): Promise<NotificationResponse[]> {
        const notifications = userIds.map((userId) => ({
            userId,
            companyId,
            ...data,
        }));

        const created = await Notification.insertMany(notifications);
        return created.map((n) => this.toResponse(n));
    }

    /**
     * Get notifications for a user
     */
    async getNotifications(
        userId: string,
        options?: {
            read?: boolean;
            limit?: number;
            skip?: number;
            sortBy?: 'createdAt' | 'read';
            sortOrder?: 'asc' | 'desc';
        }
    ): Promise<{ notifications: NotificationResponse[]; total: number }> {
        const query: any = {
            userId: new mongoose.Types.ObjectId(userId),
            deletedAt: null,
        };

        if (options?.read !== undefined) {
            query.read = options.read;
        }

        const sort: any = {};
        if (options?.sortBy) {
            sort[options.sortBy] = options.sortOrder === 'asc' ? 1 : -1;
        } else {
            sort.createdAt = -1; // Default: newest first
        }

        const limit = options?.limit || 50;
        const skip = options?.skip || 0;

        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .sort(sort)
                .limit(limit)
                .skip(skip)
                .lean(),
            Notification.countDocuments(query),
        ]);

        return {
            notifications: notifications.map((n) => this.toResponse(n as any)),
            total,
        };
    }

    /**
     * Get unread notification count for a user
     */
    async getUnreadCount(userId: string): Promise<number> {
        return Notification.countDocuments({
            userId: new mongoose.Types.ObjectId(userId),
            read: false,
            deletedAt: null,
        });
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string, userId: string): Promise<NotificationResponse> {
        const notification = await Notification.findOne({
            _id: notificationId,
            userId: new mongoose.Types.ObjectId(userId),
            deletedAt: null,
        });

        if (!notification) {
            throw new AppError('Notification not found', 404);
        }

        notification.read = true;
        notification.readAt = new Date();
        await notification.save();

        return this.toResponse(notification);
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string): Promise<number> {
        const result = await Notification.updateMany(
            {
                userId: new mongoose.Types.ObjectId(userId),
                read: false,
                deletedAt: null,
            },
            {
                $set: {
                    read: true,
                    readAt: new Date(),
                },
            }
        );

        return result.modifiedCount;
    }

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId: string, userId: string): Promise<void> {
        const notification = await Notification.findOne({
            _id: notificationId,
            userId: new mongoose.Types.ObjectId(userId),
            deletedAt: null,
        });

        if (!notification) {
            throw new AppError('Notification not found', 404);
        }

        notification.deletedAt = new Date();
        await notification.save();
    }

    /**
     * Delete all notifications for a user
     */
    async deleteAllNotifications(userId: string): Promise<number> {
        const result = await Notification.updateMany(
            {
                userId: new mongoose.Types.ObjectId(userId),
                deletedAt: null,
            },
            {
                $set: {
                    deletedAt: new Date(),
                },
            }
        );

        return result.modifiedCount;
    }

    /**
     * Convert notification document to response format
     */
    private toResponse(notification: INotification | any): NotificationResponse {
        return {
            _id: notification._id.toString(),
            userId: notification.userId.toString(),
            companyId: notification.companyId.toString(),
            title: notification.title,
            message: notification.message,
            type: notification.type,
            read: notification.read,
            readAt: notification.readAt,
            entityType: notification.entityType,
            entityId: notification.entityId?.toString(),
            actionUrl: notification.actionUrl,
            metadata: notification.metadata,
            createdAt: notification.createdAt,
            updatedAt: notification.updatedAt,
        };
    }
}
