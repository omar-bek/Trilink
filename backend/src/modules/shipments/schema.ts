import mongoose, { Schema, Document } from 'mongoose';

export enum ShipmentStatus {
  IN_PRODUCTION = 'in_production', // Items being produced/prepared
  READY_FOR_PICKUP = 'ready_for_pickup', // Ready for logistics pickup
  IN_TRANSIT = 'in_transit', // In transit to destination
  IN_CLEARANCE = 'in_clearance', // At customs/clearance
  DELIVERED = 'delivered', // Successfully delivered
  CANCELLED = 'cancelled', // Cancelled shipment
}

export enum InspectionStatus {
  PENDING = 'pending', // Inspection pending
  APPROVED = 'approved', // Inspection approved
  REJECTED = 'rejected', // Inspection rejected
}

export enum CustomsClearanceStatus {
  NOT_REQUIRED = 'not_required', // Customs clearance not required
  PENDING = 'pending', // Awaiting document submission
  DOCUMENTS_SUBMITTED = 'documents_submitted', // Documents submitted, awaiting review
  UNDER_REVIEW = 'under_review', // Customs reviewing documents
  APPROVED = 'approved', // Customs clearance approved
  REJECTED = 'rejected', // Customs clearance rejected
  RESUBMITTED = 'resubmitted', // Resubmitted after rejection
}

export interface ICustomsDocument {
  uploadId: mongoose.Types.ObjectId; // Reference to upload
  documentType: string; // e.g., 'commercial_invoice', 'packing_list', 'certificate_of_origin', 'customs_declaration'
  fileName: string;
  uploadedAt: Date;
  uploadedBy: mongoose.Types.ObjectId;
}

export interface ICustomsClearanceEvent {
  status: CustomsClearanceStatus;
  description: string;
  timestamp: Date;
  userId: mongoose.Types.ObjectId;
  rejectionReason?: string;
  customsOfficerId?: mongoose.Types.ObjectId;
  customsAuthority?: string;
}

export interface ITrackingEvent extends Document {
  shipmentId: mongoose.Types.ObjectId;
  status: ShipmentStatus;
  location?: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  description: string;
  timestamp: Date;
  userId: mongoose.Types.ObjectId;
}

export interface IShipment extends Document {
  contractId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  logisticsCompanyId: mongoose.Types.ObjectId;
  status: ShipmentStatus;
  currentLocation?: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    lastUpdated: Date;
  };
  origin: {
    address: string;
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  destination: {
    address: string;
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  estimatedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  inspectionStatus?: InspectionStatus;
  inspectedAt?: Date;
  inspectedBy?: mongoose.Types.ObjectId;
  inspectionRejectionReason?: string;
  // Customs Clearance Fields
  customsClearanceStatus?: CustomsClearanceStatus;
  customsDocuments?: Array<ICustomsDocument>;
  customsClearanceEvents?: Array<ICustomsClearanceEvent>;
  customsRejectionReason?: string;
  customsResubmissionCount?: number;
  customsClearedAt?: Date;
  customsClearedBy?: mongoose.Types.ObjectId;
  customsAuthority?: string;
  trackingEvents: Array<{
    status: ShipmentStatus;
    location?: {
      address: string;
      coordinates: {
        lat: number;
        lng: number;
      };
    };
    description: string;
    timestamp: Date;
    userId: mongoose.Types.ObjectId;
  }>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const TrackingEventSchema = new Schema<ITrackingEvent>(
  {
    shipmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ShipmentStatus),
      required: true,
    },
    location: {
      address: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    description: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ShipmentSchema = new Schema<IShipment>(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    logisticsCompanyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ShipmentStatus),
      default: ShipmentStatus.IN_PRODUCTION,
      index: true,
    },
    currentLocation: {
      address: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
      lastUpdated: { type: Date },
    },
    origin: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, required: true },
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    },
    destination: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, required: true },
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    },
    estimatedDeliveryDate: {
      type: Date,
      required: true,
    },
    actualDeliveryDate: {
      type: Date,
    },
    inspectionStatus: {
      type: String,
      enum: Object.values(InspectionStatus),
      required: false,
      index: true,
    },
    inspectedAt: {
      type: Date,
    },
    inspectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    inspectionRejectionReason: {
      type: String,
    },
    // Customs Clearance Fields
    customsClearanceStatus: {
      type: String,
      enum: Object.values(CustomsClearanceStatus),
      default: CustomsClearanceStatus.NOT_REQUIRED,
      index: true,
    },
    customsDocuments: [
      {
        uploadId: { type: Schema.Types.ObjectId, ref: 'Upload', required: true },
        documentType: { type: String, required: true },
        fileName: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
    customsClearanceEvents: [
      {
        status: { type: String, enum: Object.values(CustomsClearanceStatus), required: true },
        description: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        rejectionReason: { type: String },
        customsOfficerId: { type: Schema.Types.ObjectId, ref: 'User' },
        customsAuthority: { type: String },
      },
    ],
    customsRejectionReason: {
      type: String,
    },
    customsResubmissionCount: {
      type: Number,
      default: 0,
    },
    customsClearedAt: {
      type: Date,
    },
    customsClearedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    customsAuthority: {
      type: String,
    },
    trackingEvents: [
      {
        status: { type: String, enum: Object.values(ShipmentStatus), required: true },
        location: {
          address: { type: String },
          coordinates: {
            lat: { type: Number },
            lng: { type: Number },
          },
        },
        description: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ShipmentSchema.index({ companyId: 1, status: 1 });
ShipmentSchema.index({ contractId: 1 });
ShipmentSchema.index({ logisticsCompanyId: 1 });
ShipmentSchema.index({ 'currentLocation.coordinates': '2dsphere' });
ShipmentSchema.index({ inspectionStatus: 1 });
ShipmentSchema.index({ customsClearanceStatus: 1 });
ShipmentSchema.index({ createdAt: -1 }); // For date-based queries
ShipmentSchema.index({ companyId: 1, status: 1, createdAt: -1 }); // Company shipments filtered by status, sorted by date
ShipmentSchema.index({ contractId: 1, status: 1 }); // Contract shipments filtered by status
ShipmentSchema.index({ logisticsCompanyId: 1, status: 1, createdAt: -1 }); // Logistics company shipments filtered by status, sorted by date

// Soft delete query helper
(ShipmentSchema.query as any).active = function (this: mongoose.Query<any, any>) {
  return this.where({ deletedAt: null });
};

export const Shipment = mongoose.model<IShipment>('Shipment', ShipmentSchema);
export const TrackingEvent = mongoose.model<ITrackingEvent>(
  'TrackingEvent',
  TrackingEventSchema
);
