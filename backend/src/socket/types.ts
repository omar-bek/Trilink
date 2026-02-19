/**
 * Socket.io event types and interfaces
 */

export enum SocketEvent {
  // Bid Events
  BID_SUBMITTED = 'bid:submitted',
  BID_ACCEPTED = 'bid:accepted',
  BID_REJECTED = 'bid:rejected',
  BID_WITHDRAWN = 'bid:withdrawn',
  BID_UPDATED = 'bid:updated',

  // Contract Events
  CONTRACT_CREATED = 'contract:created',
  CONTRACT_SIGNED = 'contract:signed',
  CONTRACT_ACTIVATED = 'contract:activated',
  CONTRACT_AMENDMENT_CREATED = 'contract:amendment:created',
  CONTRACT_AMENDMENT_APPROVED = 'contract:amendment:approved',
  CONTRACT_AMENDMENT_REJECTED = 'contract:amendment:rejected',

  // Payment Events
  PAYMENT_CREATED = 'payment:created',
  PAYMENT_APPROVED = 'payment:approved',
  PAYMENT_REJECTED = 'payment:rejected',
  PAYMENT_FAILED = 'payment:failed',
  PAYMENT_RETRY = 'payment:retry',
  PAYMENT_PROCESSED = 'payment:processed',
  PAYMENT_COMPLETED = 'payment:completed',

  // Dispute Events
  DISPUTE_CREATED = 'dispute:created',
  DISPUTE_ESCALATED = 'dispute:escalated',
  DISPUTE_RESOLVED = 'dispute:resolved',
  DISPUTE_UPDATED = 'dispute:updated',

  // Shipment Events (existing)
  GPS_UPDATED = 'gps:updated',
  SHIPMENT_STATUS_UPDATED = 'shipment:status:updated',
}

export interface SocketEventPayload {
  event: SocketEvent;
  data: any;
  timestamp: Date;
  userId?: string;
  companyId?: string;
}

export interface BidEventPayload {
  bidId: string;
  rfqId: string;
  companyId: string;
  providerId: string;
  price: number;
  currency: string;
  status: string;
  [key: string]: any;
}

export interface ContractEventPayload {
  contractId: string;
  purchaseRequestId: string;
  buyerCompanyId: string;
  parties: Array<{
    companyId: string;
    userId: string;
    role: string;
  }>;
  status: string;
  [key: string]: any;
}

export interface PaymentEventPayload {
  paymentId: string;
  contractId: string;
  companyId: string;
  recipientCompanyId: string;
  amount: number;
  currency: string;
  status: string;
  milestone: string;
  [key: string]: any;
}

export interface DisputeEventPayload {
  disputeId: string;
  contractId: string;
  companyId: string;
  againstCompanyId: string;
  type: string;
  status: string;
  escalatedToGovernment: boolean;
  [key: string]: any;
}

/**
 * Socket room types
 */
export enum SocketRoom {
  COMPANY = 'company', // company:{companyId}
  USER = 'user', // user:{userId}
  CONTRACT = 'contract', // contract:{contractId}
  RFQ = 'rfq', // rfq:{rfqId}
  DISPUTE = 'dispute', // dispute:{disputeId}
  SHIPMENT = 'shipment', // shipment:{shipmentId}
}

/**
 * Socket connection health status
 */
export interface ConnectionHealth {
  socketId: string;
  userId: string;
  companyId: string;
  connectedAt: Date;
  lastPing: Date;
  rooms: string[];
  namespace: string;
  isHealthy: boolean;
}