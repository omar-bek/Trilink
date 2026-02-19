import { ShipmentStatus } from './schema';

export interface CreateShipmentDto {
  contractId: string;
  logisticsCompanyId: string;
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
  estimatedDeliveryDate: string;
}

export interface UpdateShipmentStatusDto {
  status: ShipmentStatus;
  description: string;
  location?: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
}

export interface UpdateGPSLocationDto {
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
}

export interface ShipmentResponse {
  id: string;
  contractId: string;
  companyId: string;
  logisticsCompanyId: string;
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
    userId: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
