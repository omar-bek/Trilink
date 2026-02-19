import mongoose, { Schema, Document } from 'mongoose';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  APPROVE = 'approve',
  REJECT = 'reject',
  SUBMIT = 'submit',
  SIGN = 'sign',
  ESCALATE = 'escalate',
  RESOLVE = 'resolve',
  PROCESS = 'process',
  ACTIVATE = 'activate',
  WITHDRAW = 'withdraw',
  EVALUATE = 'evaluate',
  ENABLE_ANONYMITY = 'enable_anonymity',
  REVEAL_IDENTITY = 'reveal_identity',
}

export enum AuditResource {
  USER = 'user',
  COMPANY = 'company',
  PURCHASE_REQUEST = 'purchase_request',
  RFQ = 'rfq',
  BID = 'bid',
  CONTRACT = 'contract',
  SHIPMENT = 'shipment',
  PAYMENT = 'payment',
  DISPUTE = 'dispute',
  ANALYTICS = 'analytics',
  AUDIT_LOG = 'audit_log',
}

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: mongoose.Types.ObjectId;
  details: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    changes?: Record<string, unknown>;
  };
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
  timestamp: Date;
  // Cryptographic timestamping for legal compliance (RFC 3161)
  timestampHash?: string; // SHA-256 hash of timestamp + log data
  timestampSignature?: string; // Digital signature of timestamp hash
  immutable: boolean; // Marks log as immutable (cannot be modified)
}

const AuditLogSchema = new Schema<IAuditLog>(
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
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
      index: true,
    },
    resource: {
      type: String,
      enum: Object.values(AuditResource),
      required: true,
      index: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    details: {
      before: { type: Schema.Types.Mixed },
      after: { type: Schema.Types.Mixed },
      changes: { type: Schema.Types.Mixed },
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    requestId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
      index: true,
    },
    errorMessage: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    timestampHash: {
      type: String,
      index: true,
    },
    timestampSignature: {
      type: String,
    },
    immutable: {
      type: Boolean,
      default: true, // All audit logs are immutable by default
      index: true,
    },
  },
  {
    timestamps: false, // We use timestamp field instead
  }
);

// Indexes for efficient querying
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ companyId: 1, timestamp: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 });

// TTL index to auto-delete logs older than 1 year (optional)
// AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
