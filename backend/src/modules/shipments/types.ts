import { ShipmentStatus, InspectionStatus, CustomsClearanceStatus } from './schema';

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

export interface InspectShipmentDto {
  status: InspectionStatus;
  rejectionReason?: string;
}

export interface SubmitCustomsDocumentsDto {
  documentIds: string[]; // Array of upload IDs
  documentTypes: string[]; // Array of document types corresponding to documentIds
}

export interface UpdateCustomsClearanceStatusDto {
  status: CustomsClearanceStatus;
  description: string;
  rejectionReason?: string;
  customsAuthority?: string;
}

export interface ResubmitCustomsDocumentsDto {
  documentIds: string[]; // Array of upload IDs
  documentTypes: string[]; // Array of document types corresponding to documentIds
  notes?: string;
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
  inspectionStatus?: InspectionStatus;
  inspectedAt?: Date;
  inspectedBy?: string;
  inspectionRejectionReason?: string;
  // Customs Clearance Fields
  customsClearanceStatus?: CustomsClearanceStatus;
  customsDocuments?: Array<{
    uploadId: string;
    documentType: string;
    fileName: string;
    uploadedAt: Date;
    uploadedBy: string;
  }>;
  customsClearanceEvents?: Array<{
    status: CustomsClearanceStatus;
    description: string;
    timestamp: Date;
    userId: string;
    rejectionReason?: string;
    customsOfficerId?: string;
    customsAuthority?: string;
  }>;
  customsRejectionReason?: string;
  customsResubmissionCount?: number;
  customsClearedAt?: Date;
  customsClearedBy?: string;
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
    userId: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
