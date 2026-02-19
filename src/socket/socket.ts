import { Server, Socket } from 'socket.io';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';
import { logger } from '../utils/logger';
import { ShipmentRepository } from '../modules/shipments/repository';
import { Role } from '../config/rbac';

/**
 * Setup Socket.io for real-time shipment tracking
 */
export const setupSocketIO = (io: Server): void => {
  // Authentication middleware for Socket.io
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  // Shipment tracking namespace
  const shipmentNamespace = io.of('/shipments');

  shipmentNamespace.on('connection', (socket: Socket) => {
    const user = socket.data.user as JWTPayload;
    logger.info(`Socket connected: User ${user.userId} (${user.role})`);

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

        socket.join(`shipment:${shipmentId}`);
        logger.info(`User ${user.userId} joined shipment ${shipmentId}`);
      } catch (error) {
        logger.error('Error joining shipment room:', error);
        socket.emit('error', { message: 'Failed to join shipment room' });
      }
    });

    // Leave shipment room
    socket.on('leave-shipment', (shipmentId: string) => {
      socket.leave(`shipment:${shipmentId}`);
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

        // Broadcast to all users tracking this shipment
        shipmentNamespace
          .to(`shipment:${data.shipmentId}`)
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

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: User ${user.userId}`);
    });
  });

  logger.info('Socket.io configured for shipment tracking');
};
