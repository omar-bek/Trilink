import { io, Socket, Manager } from 'socket.io-client';
import { env } from '@/config/env';

/**
 * Socket.io namespace types
 */
export type SocketNamespace = 'bids' | 'contracts' | 'payments' | 'disputes' | 'shipments';

/**
 * Socket event callback types
 */
export interface SocketEventCallbacks {
  [event: string]: (data: any) => void;
}

/**
 * Room subscription tracking
 */
interface RoomSubscription {
  namespace: SocketNamespace;
  roomType: string;
  roomId: string;
  callbacks: SocketEventCallbacks;
}

/**
 * Secure Socket.io Service with Namespace Support
 * 
 * Features:
 * - Multiple namespace connections
 * - Automatic reconnection with resubscription
 * - Room isolation (no global broadcasts)
 * - Token-based authentication
 * - Connection health monitoring
 */
class SocketService {
  private manager: Manager | null = null;
  private sockets: Map<SocketNamespace, Socket> = new Map();
  private accessToken: string | null = null;
  private subscriptions: Map<string, RoomSubscription> = new Map();
  private reconnectAttempts: Map<SocketNamespace, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  /**
   * Get base URL for socket connections
   */
  private getBaseUrl(): string {
    // Extract base URL from apiBaseUrl (remove /api suffix if present)
    return env.apiBaseUrl.replace(/\/api$/, '') || 'http://localhost:3000';
  }

  /**
   * Connect to a specific namespace
   */
  private connectToNamespace(namespace: SocketNamespace, token: string): Socket {
    const baseUrl = this.getBaseUrl();
    const namespacePath = `/${namespace}`;

    // Create manager if it doesn't exist
    if (!this.manager) {
      this.manager = new Manager(baseUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 20000,
      });
    }

    // Create socket for namespace
    const socket = this.manager.socket(namespacePath, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    // Setup connection handlers
    this.setupNamespaceHandlers(socket, namespace);

    return socket;
  }

  /**
   * Setup handlers for a namespace socket
   */
  private setupNamespaceHandlers(socket: Socket, namespace: SocketNamespace): void {
    socket.on('connect', () => {
      if (import.meta.env.DEV) {
        console.log(`[Socket] Connected to ${namespace} namespace`);
      }
      this.reconnectAttempts.set(namespace, 0);
      
      // Resubscribe to all rooms for this namespace
      this.resubscribeToRooms(namespace);
    });

    socket.on('disconnect', (reason) => {
      if (import.meta.env.DEV) {
        console.log(`[Socket] Disconnected from ${namespace} namespace:`, reason);
      }
    });

    socket.on('connect_error', async (error: any) => {
      console.error(`[Socket] Connection error in ${namespace} namespace:`, error);
      
      // If token expired, try to refresh and reconnect
      if (error.message?.includes('expired') || error.message?.includes('Invalid') || error.code === 'TOKEN_EXPIRED') {
        try {
          // Try to refresh token
          const { authService } = await import('./auth.service');
          const response = await authService.refreshToken();
          const newToken = response.data.data.accessToken;
          
          // Update token and reconnect
          this.accessToken = newToken;
          const newSocket = this.connectToNamespace(namespace, newToken);
          this.sockets.set(namespace, newSocket);
          
          if (import.meta.env.DEV) {
            console.log(`[Socket] Token refreshed and reconnected to ${namespace} namespace`);
          }
          return;
        } catch (refreshError) {
          console.error(`[Socket] Failed to refresh token for ${namespace}:`, refreshError);
          // Continue with normal error handling
        }
      }
      
      // Track reconnect attempts
      const attempts = (this.reconnectAttempts.get(namespace) || 0) + 1;
      this.reconnectAttempts.set(namespace, attempts);
      
      if (attempts >= this.maxReconnectAttempts) {
        console.error(`[Socket] Max reconnection attempts reached for ${namespace}`);
      }
    });

    socket.on('error', (error: any) => {
      console.error(`[Socket] Error in ${namespace} namespace:`, error);
    });

    // Handle ping/pong for connection health
    socket.on('ping', (data: any) => {
      socket.emit('pong', { timestamp: new Date() });
    });
  }

  /**
   * Resubscribe to all rooms for a namespace after reconnection
   */
  private resubscribeToRooms(namespace: SocketNamespace): void {
    const socket = this.sockets.get(namespace);
    if (!socket?.connected) {
      return;
    }

    // Find all subscriptions for this namespace
    this.subscriptions.forEach((subscription, key) => {
      if (subscription.namespace === namespace) {
        // Rejoin room
        this.joinRoomInternal(namespace, subscription.roomType, subscription.roomId);
        
        // Re-register event listeners
        Object.entries(subscription.callbacks).forEach(([event, callback]) => {
          socket.on(event, callback);
        });
      }
    });
  }

  /**
   * Connect to all namespaces (or specific ones)
   */
  connect(token: string, namespaces?: SocketNamespace[]): void {
    if (this.accessToken === token && this.sockets.size > 0) {
      // Already connected with same token
      return;
    }

    this.accessToken = token;
    const namespacesToConnect = namespaces || ['bids', 'contracts', 'payments', 'disputes', 'shipments'];

    // Connect to each namespace
    namespacesToConnect.forEach((namespace) => {
      if (this.sockets.has(namespace)) {
        // Disconnect existing socket
        this.sockets.get(namespace)?.disconnect();
      }

      const socket = this.connectToNamespace(namespace, token);
      this.sockets.set(namespace, socket);
    });
  }

  /**
   * Disconnect from all namespaces
   */
  disconnect(): void {
    this.sockets.forEach((socket) => {
      socket.disconnect();
    });
    this.sockets.clear();
    this.subscriptions.clear();
    this.reconnectAttempts.clear();

    if (this.manager) {
      this.manager.disconnect();
      this.manager = null;
    }

    this.accessToken = null;
  }

  /**
   * Check if connected to a namespace
   */
  isConnected(namespace?: SocketNamespace): boolean {
    if (namespace) {
      return this.sockets.get(namespace)?.connected || false;
    }
    // Check if any namespace is connected
    return Array.from(this.sockets.values()).some((socket) => socket.connected);
  }

  /**
   * Get socket for a namespace
   */
  private getSocket(namespace: SocketNamespace): Socket | null {
    return this.sockets.get(namespace) || null;
  }

  /**
   * Internal method to join a room
   */
  private joinRoomInternal(namespace: SocketNamespace, roomType: string, roomId: string): void {
    const socket = this.getSocket(namespace);
    if (!socket?.connected) {
      console.warn(`[Socket] Cannot join room: ${namespace} not connected`);
      return;
    }

    // Map room types to backend event names
    const joinEventMap: Record<string, string> = {
      rfq: 'join-rfq',
      contract: 'join-contract',
      dispute: 'join-dispute',
      shipment: 'join-shipment',
    };

    const joinEvent = joinEventMap[roomType];
    if (!joinEvent) {
      console.warn(`[Socket] Unknown room type: ${roomType}`);
      return;
    }

    socket.emit(joinEvent, roomId);
  }

  /**
   * Internal method to leave a room
   */
  private leaveRoomInternal(namespace: SocketNamespace, roomType: string, roomId: string): void {
    const socket = this.getSocket(namespace);
    if (!socket?.connected) {
      return;
    }

    const leaveEventMap: Record<string, string> = {
      rfq: 'leave-rfq',
      contract: 'leave-contract',
      dispute: 'leave-dispute',
      shipment: 'leave-shipment',
    };

    const leaveEvent = leaveEventMap[roomType];
    if (leaveEvent) {
      socket.emit(leaveEvent, roomId);
    }
  }

  /**
   * Subscribe to a room and listen for events
   */
  subscribeToRoom(
    namespace: SocketNamespace,
    roomType: 'rfq' | 'contract' | 'dispute' | 'shipment',
    roomId: string,
    callbacks: SocketEventCallbacks
  ): () => void {
    const socket = this.getSocket(namespace);
    if (!socket) {
      console.warn(`[Socket] Cannot subscribe: ${namespace} not connected`);
      return () => {}; // Return no-op unsubscribe
    }

    const subscriptionKey = `${namespace}:${roomType}:${roomId}`;

    // Store subscription
    this.subscriptions.set(subscriptionKey, {
      namespace,
      roomType,
      roomId,
      callbacks,
    });

    // Join room
    this.joinRoomInternal(namespace, roomType, roomId);

    // Register event listeners
    Object.entries(callbacks).forEach(([event, callback]) => {
      socket.on(event, callback);
    });

    // Return unsubscribe function
    return () => {
      this.unsubscribeFromRoom(namespace, roomType, roomId);
    };
  }

  /**
   * Unsubscribe from a room
   */
  unsubscribeFromRoom(
    namespace: SocketNamespace,
    roomType: 'rfq' | 'contract' | 'dispute' | 'shipment',
    roomId: string
  ): void {
    const socket = this.getSocket(namespace);
    const subscriptionKey = `${namespace}:${roomType}:${roomId}`;
    const subscription = this.subscriptions.get(subscriptionKey);

    if (subscription && socket) {
      // Remove event listeners
      Object.keys(subscription.callbacks).forEach((event) => {
        socket.off(event);
      });

      // Leave room
      this.leaveRoomInternal(namespace, roomType, roomId);
    }

    this.subscriptions.delete(subscriptionKey);
  }

  /**
   * Subscribe to shipment updates (convenience method)
   */
  subscribeToShipment(
    shipmentId: string,
    callbacks: {
      onStatusUpdate?: (data: any) => void;
      onLocationUpdate?: (data: any) => void;
    }
  ): () => void {
    const eventCallbacks: SocketEventCallbacks = {};

    if (callbacks.onStatusUpdate) {
      // Backend emits 'shipment:status:updated' event
      eventCallbacks['shipment:status:updated'] = callbacks.onStatusUpdate;
    }

    if (callbacks.onLocationUpdate) {
      // Backend emits 'gps-updated' event
      eventCallbacks['gps-updated'] = callbacks.onLocationUpdate;
    }

    return this.subscribeToRoom('shipments', 'shipment', shipmentId, eventCallbacks);
  }

  /**
   * Unsubscribe from shipment updates (convenience method)
   */
  unsubscribeFromShipment(shipmentId: string): void {
    this.unsubscribeFromRoom('shipments', 'shipment', shipmentId);
  }

  /**
   * Subscribe to RFQ updates (convenience method)
   */
  subscribeToRFQ(
    rfqId: string,
    callbacks: {
      onBidSubmitted?: (data: any) => void;
      onBidAccepted?: (data: any) => void;
      onBidRejected?: (data: any) => void;
      onBidWithdrawn?: (data: any) => void;
      onBidUpdated?: (data: any) => void;
    }
  ): () => void {
    const eventCallbacks: SocketEventCallbacks = {};

    if (callbacks.onBidSubmitted) {
      eventCallbacks['bid:submitted'] = callbacks.onBidSubmitted;
    }
    if (callbacks.onBidAccepted) {
      eventCallbacks['bid:accepted'] = callbacks.onBidAccepted;
    }
    if (callbacks.onBidRejected) {
      eventCallbacks['bid:rejected'] = callbacks.onBidRejected;
    }
    if (callbacks.onBidWithdrawn) {
      eventCallbacks['bid:withdrawn'] = callbacks.onBidWithdrawn;
    }
    if (callbacks.onBidUpdated) {
      eventCallbacks['bid:updated'] = callbacks.onBidUpdated;
    }

    return this.subscribeToRoom('bids', 'rfq', rfqId, eventCallbacks);
  }

  /**
   * Subscribe to contract updates (convenience method)
   */
  subscribeToContract(
    contractId: string,
    callbacks: {
      onContractCreated?: (data: any) => void;
      onContractSigned?: (data: any) => void;
      onContractActivated?: (data: any) => void;
      onAmendmentCreated?: (data: any) => void;
      onAmendmentApproved?: (data: any) => void;
      onAmendmentRejected?: (data: any) => void;
    }
  ): () => void {
    const eventCallbacks: SocketEventCallbacks = {};

    if (callbacks.onContractCreated) {
      eventCallbacks['contract:created'] = callbacks.onContractCreated;
    }
    if (callbacks.onContractSigned) {
      eventCallbacks['contract:signed'] = callbacks.onContractSigned;
    }
    if (callbacks.onContractActivated) {
      eventCallbacks['contract:activated'] = callbacks.onContractActivated;
    }
    if (callbacks.onAmendmentCreated) {
      eventCallbacks['contract:amendment:created'] = callbacks.onAmendmentCreated;
    }
    if (callbacks.onAmendmentApproved) {
      eventCallbacks['contract:amendment:approved'] = callbacks.onAmendmentApproved;
    }
    if (callbacks.onAmendmentRejected) {
      eventCallbacks['contract:amendment:rejected'] = callbacks.onAmendmentRejected;
    }

    return this.subscribeToRoom('contracts', 'contract', contractId, eventCallbacks);
  }

  /**
   * Subscribe to payment updates (convenience method)
   */
  subscribeToPayments(
    contractId: string,
    callbacks: {
      onPaymentCreated?: (data: any) => void;
      onPaymentApproved?: (data: any) => void;
      onPaymentRejected?: (data: any) => void;
      onPaymentProcessed?: (data: any) => void;
      onPaymentCompleted?: (data: any) => void;
    }
  ): () => void {
    const eventCallbacks: SocketEventCallbacks = {};

    if (callbacks.onPaymentCreated) {
      eventCallbacks['payment:created'] = callbacks.onPaymentCreated;
    }
    if (callbacks.onPaymentApproved) {
      eventCallbacks['payment:approved'] = callbacks.onPaymentApproved;
    }
    if (callbacks.onPaymentRejected) {
      eventCallbacks['payment:rejected'] = callbacks.onPaymentRejected;
    }
    if (callbacks.onPaymentProcessed) {
      eventCallbacks['payment:processed'] = callbacks.onPaymentProcessed;
    }
    if (callbacks.onPaymentCompleted) {
      eventCallbacks['payment:completed'] = callbacks.onPaymentCompleted;
    }

    return this.subscribeToRoom('payments', 'contract', contractId, eventCallbacks);
  }

  /**
   * Subscribe to dispute updates (convenience method)
   */
  subscribeToDispute(
    disputeId: string,
    callbacks: {
      onDisputeCreated?: (data: any) => void;
      onDisputeEscalated?: (data: any) => void;
      onDisputeResolved?: (data: any) => void;
      onDisputeUpdated?: (data: any) => void;
    }
  ): () => void {
    const eventCallbacks: SocketEventCallbacks = {};

    if (callbacks.onDisputeCreated) {
      eventCallbacks['dispute:created'] = callbacks.onDisputeCreated;
    }
    if (callbacks.onDisputeEscalated) {
      eventCallbacks['dispute:escalated'] = callbacks.onDisputeEscalated;
    }
    if (callbacks.onDisputeResolved) {
      eventCallbacks['dispute:resolved'] = callbacks.onDisputeResolved;
    }
    if (callbacks.onDisputeUpdated) {
      eventCallbacks['dispute:updated'] = callbacks.onDisputeUpdated;
    }

    return this.subscribeToRoom('disputes', 'dispute', disputeId, eventCallbacks);
  }

  /**
   * Update access token (for token refresh)
   * Reconnects all sockets with the new token
   */
  updateToken(token: string): void {
    if (this.accessToken === token) {
      return;
    }

    const previousToken = this.accessToken;
    this.accessToken = token;

    // Get current namespaces before disconnecting
    const namespaces = Array.from(this.sockets.keys()) as SocketNamespace[];
    
    // Disconnect all existing sockets
    this.sockets.forEach((socket) => {
      socket.disconnect();
    });
    this.sockets.clear();
    this.reconnectAttempts.clear();

    // Reconnect all sockets with new token
    if (namespaces.length > 0 && token) {
      namespaces.forEach((namespace) => {
        try {
          const socket = this.connectToNamespace(namespace, token);
          this.sockets.set(namespace, socket);
        } catch (error) {
          console.error(`[Socket] Failed to reconnect to ${namespace} namespace:`, error);
        }
      });
      
      if (import.meta.env.DEV) {
        console.log(`[Socket] Updated token and reconnected to ${namespaces.length} namespace(s)`);
      }
    }
  }
}

export const socketService = new SocketService();
