import mongoose, { Schema, Document } from 'mongoose';
import { Status } from '../../types/common';

export enum ShipmentStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  AT_CLEARANCE = 'at_clearance',
  CLEARED = 'cleared',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
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
      default: ShipmentStatus.PENDING,
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

// Soft delete query helper
ShipmentSchema.query.active = function () {
  return this.where({ deletedAt: null });
};

export const Shipment = mongoose.model<IShipment>('Shipment', ShipmentSchema);
export const TrackingEvent = mongoose.model<ITrackingEvent>(
  'TrackingEvent',
  TrackingEventSchema
);
