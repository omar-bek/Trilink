import { Server, Namespace } from 'socket.io';
import { SocketEvent, SocketEventPayload, SocketRoom } from './types';
import { logger } from '../utils/logger';

/**
 * Socket.io service for emitting events across namespaces
 */
export class SocketService {
  private io: Server;
  private namespaces: Map<string, Namespace> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.initializeNamespaces();
  }

  /**
   * Initialize all namespaces
   */
  private initializeNamespaces(): void {
    // Bids namespace
    this.namespaces.set('bids', this.io.of('/bids'));
    
    // Contracts namespace
    this.namespaces.set('contracts', this.io.of('/contracts'));
    
    // Payments namespace
    this.namespaces.set('payments', this.io.of('/payments'));
    
    // Disputes namespace
    this.namespaces.set('disputes', this.io.of('/disputes'));
    
    // Shipments namespace (existing)
    this.namespaces.set('shipments', this.io.of('/shipments'));
  }

  /**
   * Emit event to specific room in a namespace
   */
  emitToRoom(
    namespace: string,
    room: string,
    event: SocketEvent,
    data: any
  ): void {
    try {
      const ns = this.namespaces.get(namespace);
      if (!ns) {
        logger.warn(`Namespace ${namespace} not found`);
        return;
      }

      const payload: SocketEventPayload = {
        event,
        data,
        timestamp: new Date(),
      };

      ns.to(room).emit(event, payload);
      logger.debug(`Emitted ${event} to room ${room} in namespace ${namespace}`);
    } catch (error) {
      logger.error(`Error emitting event ${event} to ${namespace}/${room}:`, error);
    }
  }

  /**
   * Emit event to multiple rooms
   */
  emitToRooms(
    namespace: string,
    rooms: string[],
    event: SocketEvent,
    data: any
  ): void {
    rooms.forEach((room) => {
      this.emitToRoom(namespace, room, event, data);
    });
  }

  /**
   * Emit event to company room
   */
  emitToCompany(
    namespace: string,
    companyId: string,
    event: SocketEvent,
    data: any
  ): void {
    const room = `${SocketRoom.COMPANY}:${companyId}`;
    this.emitToRoom(namespace, room, event, data);
  }

  /**
   * Emit event to user room
   */
  emitToUser(
    namespace: string,
    userId: string,
    event: SocketEvent,
    data: any
  ): void {
    const room = `${SocketRoom.USER}:${userId}`;
    this.emitToRoom(namespace, room, event, data);
  }

  /**
   * Emit event to multiple companies
   */
  emitToCompanies(
    namespace: string,
    companyIds: string[],
    event: SocketEvent,
    data: any
  ): void {
    companyIds.forEach((companyId) => {
      this.emitToCompany(namespace, companyId, event, data);
    });
  }

  /**
   * Emit bid event
   */
  emitBidEvent(event: SocketEvent, data: any, targetCompanyIds: string[]): void {
    this.emitToCompanies('bids', targetCompanyIds, event, data);
  }

  /**
   * Emit contract event
   */
  emitContractEvent(
    event: SocketEvent,
    data: any,
    targetCompanyIds: string[]
  ): void {
    this.emitToCompanies('contracts', targetCompanyIds, event, data);
    
    // Also emit to contract-specific room
    if (data.contractId) {
      const room = `${SocketRoom.CONTRACT}:${data.contractId}`;
      this.emitToRoom('contracts', room, event, data);
    }
  }

  /**
   * Emit payment event
   */
  emitPaymentEvent(
    event: SocketEvent,
    data: any,
    targetCompanyIds: string[]
  ): void {
    this.emitToCompanies('payments', targetCompanyIds, event, data);
    
    // Also emit to contract room
    if (data.contractId) {
      const room = `${SocketRoom.CONTRACT}:${data.contractId}`;
      this.emitToRoom('payments', room, event, data);
    }
  }

  /**
   * Emit dispute event
   */
  emitDisputeEvent(
    event: SocketEvent,
    data: any,
    targetCompanyIds: string[]
  ): void {
    this.emitToCompanies('disputes', targetCompanyIds, event, data);
    
    // Also emit to dispute-specific room
    if (data.disputeId) {
      const room = `${SocketRoom.DISPUTE}:${data.disputeId}`;
      this.emitToRoom('disputes', room, event, data);
    }
  }

  /**
   * Get namespace
   */
  getNamespace(name: string): Namespace | undefined {
    return this.namespaces.get(name);
  }
}

// Singleton instance (will be initialized in server.ts)
let socketServiceInstance: SocketService | null = null;

export const initializeSocketService = (io: Server): SocketService => {
  socketServiceInstance = new SocketService(io);
  return socketServiceInstance;
};

export const getSocketService = (): SocketService => {
  if (!socketServiceInstance) {
    throw new Error('SocketService not initialized. Call initializeSocketService first.');
  }
  return socketServiceInstance;
};
