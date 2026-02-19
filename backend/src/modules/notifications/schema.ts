import mongoose, { Schema, Document } from 'mongoose';

export enum NotificationType {
    SUCCESS = 'success',
    ERROR = 'error',
    WARNING = 'warning',
    INFO = 'info',
}

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    companyId: mongoose.Types.ObjectId;
    title: string;
    message?: string;
    type: NotificationType;
    read: boolean;
    readAt?: Date;
    entityType?: 'rfq' | 'bid' | 'contract' | 'dispute' | 'payment' | 'shipment';
    entityId?: mongoose.Types.ObjectId;
    actionUrl?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        companyId: {
            type: Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            enum: Object.values(NotificationType),
            default: NotificationType.INFO,
            index: true,
        },
        read: {
            type: Boolean,
            default: false,
            index: true,
        },
        readAt: {
            type: Date,
            default: null,
        },
        entityType: {
            type: String,
            enum: ['rfq', 'bid', 'contract', 'dispute', 'payment', 'shipment'],
            index: true,
        },
        entityId: {
            type: Schema.Types.ObjectId,
            index: true,
        },
        actionUrl: {
            type: String,
            trim: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ companyId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, deletedAt: 1 });
NotificationSchema.index({ entityType: 1, entityId: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
