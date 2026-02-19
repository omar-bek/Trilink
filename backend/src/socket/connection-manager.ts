import { Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { JWTPayload } from '../utils/jwt';

/**
 * Connection limits configuration
 */
export interface ConnectionLimits {
  maxConnectionsPerUser: number;
  maxConnectionsPerCompany: number;
  maxConnectionsPerIP: number;
}

/**
 * Default connection limits
 */
export const DEFAULT_CONNECTION_LIMITS: ConnectionLimits = {
  maxConnectionsPerUser: 5, // Max 5 connections per user
  maxConnectionsPerCompany: 100, // Max 100 connections per company
  maxConnectionsPerIP: 10, // Max 10 connections per IP address
};

/**
 * Connection tracking data
 */
interface ConnectionInfo {
  socketId: string;
  userId: string;
  companyId: string;
  ipAddress: string;
  connectedAt: Date;
  rooms: Set<string>;
  lastPing: Date;
  namespace: string;
}

/**
 * Connection Manager
 * Tracks connections, enforces limits, and manages room cleanup
 */
export class ConnectionManager {
  private connections: Map<string, ConnectionInfo> = new Map();
  private userConnections: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private companyConnections: Map<string, Set<string>> = new Map(); // companyId -> Set of socketIds
  private ipConnections: Map<string, Set<string>> = new Map(); // ipAddress -> Set of socketIds
  private limits: ConnectionLimits;

  constructor(limits: ConnectionLimits = DEFAULT_CONNECTION_LIMITS) {
    this.limits = limits;
  }

  /**
   * Register a new connection
   * Returns true if connection is allowed, false if limit exceeded
   */
  registerConnection(
    socket: Socket,
    user: JWTPayload,
    namespace: string
  ): { allowed: boolean; reason?: string } {
    const socketId = socket.id;
    const ipAddress = socket.handshake.address || socket.request.socket.remoteAddress || 'unknown';

    // Check user connection limit
    const userSocketIds = this.userConnections.get(user.userId) || new Set();
    if (userSocketIds.size >= this.limits.maxConnectionsPerUser) {
      logger.warn(
        `Connection limit exceeded for user ${user.userId}: ${userSocketIds.size}/${this.limits.maxConnectionsPerUser}`
      );
      return {
        allowed: false,
        reason: `Maximum ${this.limits.maxConnectionsPerUser} connections per user exceeded`,
      };
    }

    // Check company connection limit
    const companySocketIds = this.companyConnections.get(user.companyId) || new Set();
    if (companySocketIds.size >= this.limits.maxConnectionsPerCompany) {
      logger.warn(
        `Connection limit exceeded for company ${user.companyId}: ${companySocketIds.size}/${this.limits.maxConnectionsPerCompany}`
      );
      return {
        allowed: false,
        reason: `Maximum ${this.limits.maxConnectionsPerCompany} connections per company exceeded`,
      };
    }

    // Check IP connection limit
    const ipSocketIds = this.ipConnections.get(ipAddress) || new Set();
    if (ipSocketIds.size >= this.limits.maxConnectionsPerIP) {
      logger.warn(
        `Connection limit exceeded for IP ${ipAddress}: ${ipSocketIds.size}/${this.limits.maxConnectionsPerIP}`
      );
      return {
        allowed: false,
        reason: `Maximum ${this.limits.maxConnectionsPerIP} connections per IP address exceeded`,
      };
    }

    // Register connection
    const connectionInfo: ConnectionInfo = {
      socketId,
      userId: user.userId,
      companyId: user.companyId,
      ipAddress,
      connectedAt: new Date(),
      rooms: new Set(),
      lastPing: new Date(),
      namespace,
    };

    this.connections.set(socketId, connectionInfo);
    userSocketIds.add(socketId);
    this.userConnections.set(user.userId, userSocketIds);
    companySocketIds.add(socketId);
    this.companyConnections.set(user.companyId, companySocketIds);
    ipSocketIds.add(socketId);
    this.ipConnections.set(ipAddress, ipSocketIds);

    logger.info(
      `Connection registered: ${socketId} (User: ${user.userId}, Company: ${user.companyId}, IP: ${ipAddress}, Namespace: ${namespace})`
    );

    return { allowed: true };
  }

  /**
   * Track room join
   */
  trackRoomJoin(socketId: string, room: string): void {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.rooms.add(room);
      logger.debug(`Socket ${socketId} joined room: ${room}`);
    }
  }

  /**
   * Track room leave
   */
  trackRoomLeave(socketId: string, room: string): void {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.rooms.delete(room);
      logger.debug(`Socket ${socketId} left room: ${room}`);
    }
  }

  /**
   * Update last ping time
   */
  updatePing(socketId: string): void {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.lastPing = new Date();
    }
  }

  /**
   * Get rooms for a socket
   */
  getRooms(socketId: string): string[] {
    const connection = this.connections.get(socketId);
    return connection ? Array.from(connection.rooms) : [];
  }

  /**
   * Unregister connection and cleanup
   */
  unregisterConnection(socketId: string): string[] {
    const connection = this.connections.get(socketId);
    if (!connection) {
      return [];
    }

    const rooms = Array.from(connection.rooms);

    // Remove from user connections
    const userSocketIds = this.userConnections.get(connection.userId);
    if (userSocketIds) {
      userSocketIds.delete(socketId);
      if (userSocketIds.size === 0) {
        this.userConnections.delete(connection.userId);
      }
    }

    // Remove from company connections
    const companySocketIds = this.companyConnections.get(connection.companyId);
    if (companySocketIds) {
      companySocketIds.delete(socketId);
      if (companySocketIds.size === 0) {
        this.companyConnections.delete(connection.companyId);
      }
    }

    // Remove from IP connections
    const ipSocketIds = this.ipConnections.get(connection.ipAddress);
    if (ipSocketIds) {
      ipSocketIds.delete(socketId);
      if (ipSocketIds.size === 0) {
        this.ipConnections.delete(connection.ipAddress);
      }
    }

    // Remove connection
    this.connections.delete(socketId);

    logger.info(
      `Connection unregistered: ${socketId} (User: ${connection.userId}, Company: ${connection.companyId}, Rooms: ${rooms.length})`
    );

    return rooms;
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    connectionsByUser: number;
    connectionsByCompany: number;
    connectionsByIP: number;
  } {
    return {
      totalConnections: this.connections.size,
      connectionsByUser: this.userConnections.size,
      connectionsByCompany: this.companyConnections.size,
      connectionsByIP: this.ipConnections.size,
    };
  }

  /**
   * Get stale connections (no ping for more than timeout)
   */
  getStaleConnections(timeoutMs: number): string[] {
    const now = new Date();
    const stale: string[] = [];

    this.connections.forEach((connection, socketId) => {
      const timeSincePing = now.getTime() - connection.lastPing.getTime();
      if (timeSincePing > timeoutMs) {
        stale.push(socketId);
      }
    });

    return stale;
  }

  /**
   * Cleanup stale connections
   */
  cleanupStaleConnections(timeoutMs: number): number {
    const stale = this.getStaleConnections(timeoutMs);
    stale.forEach((socketId) => {
      this.unregisterConnection(socketId);
    });
    return stale.length;
  }
}

// Singleton instance
let connectionManagerInstance: ConnectionManager | null = null;

export const getConnectionManager = (limits?: ConnectionLimits): ConnectionManager => {
  if (!connectionManagerInstance) {
    connectionManagerInstance = new ConnectionManager(limits);
  }
  return connectionManagerInstance;
};

export const resetConnectionManager = (): void => {
  connectionManagerInstance = null;
};
