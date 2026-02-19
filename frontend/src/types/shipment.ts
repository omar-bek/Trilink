export enum ShipmentStatus {
  IN_PRODUCTION = 'in_production',
  READY_FOR_PICKUP = 'ready_for_pickup',
  IN_TRANSIT = 'in_transit',
  IN_CLEARANCE = 'in_clearance',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum CustomsClearanceStatus {
  NOT_REQUIRED = 'not_required',
  PENDING = 'pending',
  DOCUMENTS_SUBMITTED = 'documents_submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RESUBMITTED = 'resubmitted',
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  address: string;
  coordinates: Coordinates;
}

export interface LocationWithUpdate extends Location {
  lastUpdated: string;
}

export interface OriginDestination {
  address: string;
  city: string;
  country: string;
  coordinates: Coordinates;
}

export interface TrackingEvent {
  status: ShipmentStatus;
  location?: Location;
  description: string;
  timestamp: string;
  userId: string;
}

export interface CustomsDocument {
  uploadId: string;
  documentType: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface CustomsClearanceEvent {
  status: CustomsClearanceStatus;
  description: string;
  timestamp: string;
  userId: string;
  rejectionReason?: string;
  customsOfficerId?: string;
  customsAuthority?: string;
}

export interface Shipment {
  id?: string; // Standardized field name
  _id: string; // For backward compatibility
  contractId: string;
  companyId: string;
  logisticsCompanyId: string;
  status: ShipmentStatus;
  currentLocation?: LocationWithUpdate;
  origin: OriginDestination;
  destination: OriginDestination;
  estimatedDeliveryDate: string;
  actualDeliveryDate?: string;
  trackingEvents: TrackingEvent[];
  // Customs Clearance Fields
  customsClearanceStatus?: CustomsClearanceStatus;
  customsDocuments?: CustomsDocument[];
  customsClearanceEvents?: CustomsClearanceEvent[];
  customsRejectionReason?: string;
  customsResubmissionCount?: number;
  customsClearedAt?: string;
  customsClearedBy?: string;
  customsAuthority?: string; // Customs authority name
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentFilters {
  status?: ShipmentStatus;
  contractId?: string;
}

export interface ShipmentStatusUpdate {
  shipmentId: string;
  status: ShipmentStatus;
  description: string;
  location?: Location;
}

export interface GPSLocationUpdate {
  shipmentId: string;
  coordinates: Coordinates;
  address: string;
}

export interface CreateShipmentDto {
  contractId: string;
  logisticsCompanyId: string;
  origin: OriginDestination;
  destination: OriginDestination;
  estimatedDeliveryDate: string;
}

export interface UpdateShipmentStatusDto {
  status: ShipmentStatus;
  description: string;
  location?: Location;
}

export interface UpdateGPSLocationDto {
  coordinates: Coordinates;
  address: string;
}

export interface InspectShipmentDto {
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface SubmitCustomsDocumentsDto {
  documentIds: string[];
  documentTypes: string[];
}

export interface UpdateCustomsClearanceStatusDto {
  status: CustomsClearanceStatus;
  description: string;
  rejectionReason?: string;
  customsAuthority?: string;
}

export interface ResubmitCustomsDocumentsDto {
  documentIds: string[];
  documentTypes: string[];
  notes?: string;
}