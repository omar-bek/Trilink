import { Server, Socket } from 'socket.io';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';
import { logger } from '../utils/logger';
import { ShipmentRepository } from '../modules/shipments/repository';
import { Role } from '../config/rbac';
import { ShipmentStatus } from '../modules/shipments/schema';
import { SocketRoom } from './types';
import mongoose from 'mongoose';
import {
  getConnectionManager,
  DEFAULT_CONNECTION_LIMITS,
  ConnectionLimits,
} from './connection-manager';

/**
 * Authentication middleware for Socket.io
 */
const authenticateSocket = (socket: Socket, next: (err?: Error) => void): void => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      logger.warn(`Socket connection rejected: No token provided (Socket ID: ${socket.id})`);
      return next(new Error('Authentication token required'));
    }

    try {
      const payload = verifyAccessToken(token);
      
      // Validate payload structure
      if (!payload || !payload.userId || !payload.companyId) {
        logger.warn(`Socket connection rejected: Invalid token payload (Socket ID: ${socket.id})`);
        return next(new Error('Invalid authentication token'));
      }
      
      socket.data.user = payload;
      next();
    } catch (tokenError: any) {
      // Token expired or invalid - provide more specific error
      const errorMessage = tokenError.message || 'Invalid or expired access token';
      logger.warn(`Socket connection rejected: Token verification failed (Socket ID: ${socket.id}) ${errorMessage}`);
      
      // Return error with more details for client to handle
      const error = new Error(errorMessage);
      (error as any).code = 'TOKEN_EXPIRED';
      return next(error);
    }
  } catch (error) {
    logger.warn(`Socket connection rejected: Authentication error (Socket ID: ${socket.id})`, error);
    next(new Error('Authentication failed'));
  }
};

/**
 * Setup room subscriptions for a socket connection
 */
const setupRoomSubscriptions = (
  socket: Socket,
  user: JWTPayload,
  namespace: string
): void => {
  const connectionManager = getConnectionManager();

  // Join company room
  const companyRoom = `${SocketRoom.COMPANY}:${user.companyId}`;
  socket.join(companyRoom);
  connectionManager.trackRoomJoin(socket.id, companyRoom);
  logger.debug(`User ${user.userId} joined company room: ${user.companyId}`);

  // Join user-specific room
  const userRoom = `${SocketRoom.USER}:${user.userId}`;
  socket.join(userRoom);
  connectionManager.trackRoomJoin(socket.id, userRoom);
  logger.debug(`User ${user.userId} joined user room`);
};

/**
 * Setup heartbeat/ping mechanism
 */
const setupHeartbeat = (socket: Socket): void => {
  const connectionManager = getConnectionManager();

  // Handle ping from client
  socket.on('ping', () => {
    connectionManager.updatePing(socket.id);
    socket.emit('pong', { timestamp: new Date() });
  });

  // Send periodic ping to client
  const pingInterval = setInterval(() => {
    if (socket.connected) {
      socket.emit('ping', { timestamp: new Date() });
    } else {
      clearInterval(pingInterval);
    }
  }, 30000); // Ping every 30 seconds

  // Store interval ID for cleanup
  socket.data.pingInterval = pingInterval;
};

/**
 * Cleanup on disconnect
 */
const cleanupOnDisconnect = (socket: Socket, namespace: string): void => {
  const connectionManager = getConnectionManager();

  socket.on('disconnect', (reason) => {
    logger.info(
      `Socket disconnected: ${socket.id} (Namespace: ${namespace}, Reason: ${reason})`
    );

    // Get all rooms before cleanup
    const rooms = connectionManager.getRooms(socket.id);

    // Cleanup ping interval
    if (socket.data.pingInterval) {
      clearInterval(socket.data.pingInterval);
    }

    // Unregister connection and get rooms for logging
    const cleanedRooms = connectionManager.unregisterConnection(socket.id);

    logger.info(
      `Cleaned up ${cleanedRooms.length} rooms for socket ${socket.id}: ${cleanedRooms.join(', ')}`
    );
  });
};

/**
 * Setup Socket.io for real-time notifications
 */
export const setupSocketIO = (
  io: Server,
  connectionLimits?: ConnectionLimits
): void => {
  // Initialize connection manager with limits
  if (connectionLimits) {
    getConnectionManager(connectionLimits);
  }

  // Apply authentication middleware to all namespaces
  io.use(authenticateSocket);

  // Setup namespaces
  setupBidsNamespace(io);
  setupContractsNamespace(io);
  setupPaymentsNamespace(io);
  setupDisputesNamespace(io);
  setupShipmentsNamespace(io);

  // Setup periodic cleanup of stale connections (every 5 minutes)
  setInterval(() => {
    const connectionManager = getConnectionManager();
    const cleaned = connectionManager.cleanupStaleConnections(5 * 60 * 1000); // 5 minutes timeout
    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} stale connections`);
    }
  }, 5 * 60 * 1000);

  logger.info('Socket.io configured for all namespaces');
};

/**
 * Setup Bids namespace
 */
const setupBidsNamespace = (io: Server): void => {
  const bidsNamespace = io.of('/bids');
  const connectionManager = getConnectionManager();

  // Apply authentication middleware to this namespace
  bidsNamespace.use(authenticateSocket);

  bidsNamespace.on('connection', (socket: Socket) => {
    const user = socket.data.user as JWTPayload | undefined;

    // Validate user exists (should be set by auth middleware)
    if (!user || !user.userId) {
      logger.error('Connection rejected: User not authenticated');
      socket.emit('error', { message: 'Authentication required' });
      socket.disconnect(true);
      return;
    }

    // Check connection limits
    const registration = connectionManager.registerConnection(
      socket,
      user,
      '/bids'
    );

    if (!registration.allowed) {
      logger.warn(
        `Connection rejected for user ${user.userId}: ${registration.reason}`
      );
      socket.emit('error', { message: registration.reason });
      socket.disconnect(true);
      return;
    }

    logger.info(`Bids namespace: User ${user.userId} connected`);

    setupRoomSubscriptions(socket, user, '/bids');
    setupHeartbeat(socket);
    cleanupOnDisconnect(socket, '/bids');

    // Join RFQ room for bid notifications
    socket.on('join-rfq', (rfqId: string) => {
      const room = `${SocketRoom.RFQ}:${rfqId}`;
      socket.join(room);
      connectionManager.trackRoomJoin(socket.id, room);
      logger.debug(`User ${user.userId} joined RFQ room: ${rfqId}`);
    });

    socket.on('leave-rfq', (rfqId: string) => {
      const room = `${SocketRoom.RFQ}:${rfqId}`;
      socket.leave(room);
      connectionManager.trackRoomLeave(socket.id, room);
      logger.debug(`User ${user.userId} left RFQ room: ${rfqId}`);
    });
  });
};

/**
 * Setup Contracts namespace
 */
const setupContractsNamespace = (io: Server): void => {
  const contractsNamespace = io.of('/contracts');
  const connectionManager = getConnectionManager();

  // Apply authentication middleware to this namespace
  contractsNamespace.use(authenticateSocket);

  contractsNamespace.on('connection', (socket: Socket) => {
    const user = socket.data.user as JWTPayload | undefined;

    // Validate user exists (should be set by auth middleware)
    if (!user || !user.userId) {
      logger.error('Connection rejected: User not authenticated');
      socket.emit('error', { message: 'Authentication required' });
      socket.disconnect(true);
      return;
    }

    // Check connection limits
    const registration = connectionManager.registerConnection(
      socket,
      user,
      '/contracts'
    );

    if (!registration.allowed) {
      logger.warn(
        `Connection rejected for user ${user.userId}: ${registration.reason}`
      );
      socket.emit('error', { message: registration.reason });
      socket.disconnect(true);
      return;
    }

    logger.info(`Contracts namespace: User ${user.userId} connected`);

    setupRoomSubscriptions(socket, user, '/contracts');
    setupHeartbeat(socket);
    cleanupOnDisconnect(socket, '/contracts');

    // Join contract room for contract notifications
    socket.on('join-contract', (contractId: string) => {
      const room = `${SocketRoom.CONTRACT}:${contractId}`;
      socket.join(room);
      connectionManager.trackRoomJoin(socket.id, room);
      logger.debug(`User ${user.userId} joined contract room: ${contractId}`);
    });

    socket.on('leave-contract', (contractId: string) => {
      const room = `${SocketRoom.CONTRACT}:${contractId}`;
      socket.leave(room);
      connectionManager.trackRoomLeave(socket.id, room);
      logger.debug(`User ${user.userId} left contract room: ${contractId}`);
    });
  });
};

/**
 * Setup Payments namespace
 */
const setupPaymentsNamespace = (io: Server): void => {
  const paymentsNamespace = io.of('/payments');
  const connectionManager = getConnectionManager();

  // Apply authentication middleware to this namespace
  paymentsNamespace.use(authenticateSocket);

  paymentsNamespace.on('connection', (socket: Socket) => {
    const user = socket.data.user as JWTPayload | undefined;

    // Validate user exists (should be set by auth middleware)
    if (!user || !user.userId) {
      logger.error('Connection rejected: User not authenticated');
      socket.emit('error', { message: 'Authentication required' });
      socket.disconnect(true);
      return;
    }

    // Check connection limits
    const registration = connectionManager.registerConnection(
      socket,
      user,
      '/payments'
    );

    if (!registration.allowed) {
      logger.warn(
        `Connection rejected for user ${user.userId}: ${registration.reason}`
      );
      socket.emit('error', { message: registration.reason });
      socket.disconnect(true);
      return;
    }

    logger.info(`Payments namespace: User ${user.userId} connected`);

    setupRoomSubscriptions(socket, user, '/payments');
    setupHeartbeat(socket);
    cleanupOnDisconnect(socket, '/payments');

    // Join contract room for payment notifications
    socket.on('join-contract', (contractId: string) => {
      const room = `${SocketRoom.CONTRACT}:${contractId}`;
      socket.join(room);
      connectionManager.trackRoomJoin(socket.id, room);
      logger.debug(`User ${user.userId} joined contract room for payments: ${contractId}`);
    });
  });
};

/**
 * Setup Disputes namespace
 */
const setupDisputesNamespace = (io: Server): void => {
  const disputesNamespace = io.of('/disputes');
  const connectionManager = getConnectionManager();

  // Apply authentication middleware to this namespace
  disputesNamespace.use(authenticateSocket);

  disputesNamespace.on('connection', (socket: Socket) => {
    const user = socket.data.user as JWTPayload | undefined;

    // Validate user exists (should be set by auth middleware)
    if (!user || !user.userId) {
      logger.error('Connection rejected: User not authenticated');
      socket.emit('error', { message: 'Authentication required' });
      socket.disconnect(true);
      return;
    }

    // Check connection limits
    const registration = connectionManager.registerConnection(
      socket,
      user,
      '/disputes'
    );

    if (!registration.allowed) {
      logger.warn(
        `Connection rejected for user ${user.userId}: ${registration.reason}`
      );
      socket.emit('error', { message: registration.reason });
      socket.disconnect(true);
      return;
    }

    logger.info(`Disputes namespace: User ${user.userId} connected`);

    setupRoomSubscriptions(socket, user, '/disputes');
    setupHeartbeat(socket);
    cleanupOnDisconnect(socket, '/disputes');

    // Join dispute room for dispute notifications
    socket.on('join-dispute', (disputeId: string) => {
      const room = `${SocketRoom.DISPUTE}:${disputeId}`;
      socket.join(room);
      connectionManager.trackRoomJoin(socket.id, room);
      logger.debug(`User ${user.userId} joined dispute room: ${disputeId}`);
    });

    socket.on('leave-dispute', (disputeId: string) => {
      const room = `${SocketRoom.DISPUTE}:${disputeId}`;
      socket.leave(room);
      connectionManager.trackRoomLeave(socket.id, room);
      logger.debug(`User ${user.userId} left dispute room: ${disputeId}`);
    });
  });
};

/**
 * Setup Shipments namespace (existing functionality)
 */
const setupShipmentsNamespace = (io: Server): void => {
  const shipmentNamespace = io.of('/shipments');
  const connectionManager = getConnectionManager();

  // Apply authentication middleware to this namespace
  shipmentNamespace.use(authenticateSocket);

  shipmentNamespace.on('connection', (socket: Socket) => {
    const user = socket.data.user as JWTPayload | undefined;

    // Validate user exists (should be set by auth middleware)
    if (!user || !user.userId) {
      logger.error('Connection rejected: User not authenticated');
      socket.emit('error', { message: 'Authentication required' });
      socket.disconnect(true);
      return;
    }

    // Check connection limits
    const registration = connectionManager.registerConnection(
      socket,
      user,
      '/shipments'
    );

    if (!registration.allowed) {
      logger.warn(
        `Connection rejected for user ${user.userId}: ${registration.reason}`
      );
      socket.emit('error', { message: registration.reason });
      socket.disconnect(true);
      return;
    }

    logger.info(`Shipments namespace: User ${user.userId} connected`);

    setupRoomSubscriptions(socket, user, '/shipments');
    setupHeartbeat(socket);
    cleanupOnDisconnect(socket, '/shipments');

    // Join shipment room for tracking
    socket.on('join-shipment', async (shipmentId: string) => {
      try {
        const shipmentRepository = new ShipmentRepository();
        const shipment = await shipmentRepository.findById(shipmentId);

        if (!shipment) {
          socket.emit('error', { message: 'Shipment not found' });
          return;
        }

        // Check if user has permission to track this shipment
        const canTrack =
          shipment.companyId.toString() === user.companyId ||
          shipment.logisticsCompanyId.toString() === user.companyId ||
          user.role === Role.ADMIN ||
          user.role === Role.GOVERNMENT;

        if (!canTrack) {
          socket.emit('error', { message: 'Permission denied' });
          return;
        }

        const room = `${SocketRoom.SHIPMENT}:${shipmentId}`;
        socket.join(room);
        connectionManager.trackRoomJoin(socket.id, room);
        logger.info(`User ${user.userId} joined shipment ${shipmentId}`);
      } catch (error) {
        logger.error('Error joining shipment room:', error);
        socket.emit('error', { message: 'Failed to join shipment room' });
      }
    });

    // Leave shipment room
    socket.on('leave-shipment', (shipmentId: string) => {
      const room = `${SocketRoom.SHIPMENT}:${shipmentId}`;
      socket.leave(room);
      connectionManager.trackRoomLeave(socket.id, room);
      logger.info(`User ${user.userId} left shipment ${shipmentId}`);
    });

    // Update GPS location (Logistics role only)
    socket.on('update-gps', async (data: { shipmentId: string; location: any }) => {
      try {
        // Verify user is Logistics role
        if (user.role !== Role.LOGISTICS && user.role !== Role.ADMIN) {
          socket.emit('error', { message: 'Only Logistics can update GPS' });
          return;
        }

        const shipmentRepository = new ShipmentRepository();
        const shipment = await shipmentRepository.findById(data.shipmentId);

        if (!shipment) {
          socket.emit('error', { message: 'Shipment not found' });
          return;
        }

        // Verify shipment belongs to user's company
        if (
          shipment.logisticsCompanyId.toString() !== user.companyId &&
          user.role !== Role.ADMIN
        ) {
          socket.emit('error', { message: 'Permission denied' });
          return;
        }

        // Update GPS location
        await shipmentRepository.updateGPSLocation(data.shipmentId, {
          coordinates: data.location.coordinates,
          address: data.location.address,
        });

        // Add tracking event for GPS update (if shipment is in transit or in clearance)
        if (
          shipment.status === ShipmentStatus.IN_TRANSIT ||
          shipment.status === ShipmentStatus.IN_CLEARANCE
        ) {
          await shipmentRepository.addTrackingEvent(data.shipmentId, {
            status: shipment.status,
            location: {
              address: data.location.address,
              coordinates: data.location.coordinates,
            },
            description: `GPS location updated: ${data.location.address}`,
            userId: new mongoose.Types.ObjectId(user.userId),
          });
        }

        // Broadcast to all users tracking this shipment
        shipmentNamespace
          .to(`${SocketRoom.SHIPMENT}:${data.shipmentId}`)
          .emit('gps-updated', {
            shipmentId: data.shipmentId,
            location: data.location,
            timestamp: new Date(),
          });

        logger.info(`GPS updated for shipment ${data.shipmentId} by user ${user.userId}`);
      } catch (error) {
        logger.error('Error updating GPS:', error);
        socket.emit('error', { message: 'Failed to update GPS location' });
      }
    });

    // Disconnect cleanup is handled by cleanupOnDisconnect
  });
};
