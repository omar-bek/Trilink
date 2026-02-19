# Socket.IO Scaling & Optimization Guide

This document describes the Socket.IO scaling and optimization features implemented for the TriLink Platform.

## Features Implemented

### 1. Connection Limits

Connection limits prevent resource exhaustion and ensure fair usage:

- **Per User**: Maximum 5 connections per user (configurable)
- **Per Company**: Maximum 100 connections per company (configurable)
- **Per IP**: Maximum 10 connections per IP address (configurable)

**Configuration** (Environment Variables):
```env
SOCKET_MAX_CONNECTIONS_PER_USER=5
SOCKET_MAX_CONNECTIONS_PER_COMPANY=100
SOCKET_MAX_CONNECTIONS_PER_IP=10
```

**Behavior**:
- When limit is exceeded, new connections are rejected with an error message
- Existing connections are not affected
- Limits are enforced per namespace

### 2. Room Cleanup on Disconnect

Automatic cleanup of rooms when sockets disconnect:

- **Tracks all rooms** joined by each socket
- **Automatically leaves all rooms** on disconnect
- **Logs cleanup** for debugging and monitoring
- **Prevents orphaned rooms** from accumulating

**Implementation**:
- Connection manager tracks all room joins/leaves
- On disconnect, all tracked rooms are cleaned up
- Prevents memory leaks and stale room subscriptions

### 3. Redis Adapter for Multi-Server Scaling

Enables Socket.io to work across multiple server instances:

**Benefits**:
- **Horizontal scaling** - Run multiple server instances
- **Load balancing** - Distribute connections across servers
- **Shared state** - Rooms and events work across all servers
- **High availability** - No single point of failure

**Setup**:
1. Install dependencies:
```bash
npm install @socket.io/redis-adapter redis
```

2. Configure Redis URL:
```env
REDIS_URL=redis://localhost:6379
```

3. The adapter is automatically configured on server startup

**How It Works**:
- Uses Redis pub/sub for cross-server communication
- Events emitted on one server are broadcast to all servers
- Room subscriptions work across all server instances
- Gracefully falls back to single-server mode if Redis unavailable

### 4. Heartbeat/Ping Health Checks

Implements ping/pong mechanism for connection health monitoring:

**Features**:
- **Server-initiated ping** - Server sends ping every 30 seconds
- **Client response** - Client responds with pong
- **Connection tracking** - Last ping time tracked per connection
- **Stale connection cleanup** - Connections without ping for 5+ minutes are cleaned up

**Implementation**:
- Server sends `ping` event every 30 seconds
- Client should respond with `pong` event
- Connection manager tracks last ping time
- Periodic cleanup removes stale connections

**Client Example**:
```javascript
socket.on('ping', (data) => {
  socket.emit('pong', { timestamp: new Date() });
});
```

## Architecture

### Connection Manager

The `ConnectionManager` class tracks:
- All active connections
- Rooms joined by each connection
- Connection limits per user/company/IP
- Last ping time for health checks

### Connection Lifecycle

1. **Connection** → Authenticate → Check limits → Register → Join default rooms
2. **Active** → Track room joins/leaves → Handle ping/pong → Process events
3. **Disconnect** → Cleanup rooms → Unregister → Log statistics

## Configuration

### Environment Variables

```env
# Redis Configuration (for multi-server scaling)
REDIS_URL=redis://localhost:6379

# Connection Limits
SOCKET_MAX_CONNECTIONS_PER_USER=5
SOCKET_MAX_CONNECTIONS_PER_COMPANY=100
SOCKET_MAX_CONNECTIONS_PER_IP=10
```

### Socket.IO Options

```typescript
{
  connectTimeout: 45000,  // 45 seconds
  pingTimeout: 20000,     // 20 seconds
  pingInterval: 25000,    // 25 seconds
}
```

## Monitoring

### Connection Statistics

Access connection statistics via the connection manager:

```typescript
import { getConnectionManager } from './socket/connection-manager';

const stats = getConnectionManager().getStats();
// {
//   totalConnections: 150,
//   connectionsByUser: 45,
//   connectionsByCompany: 12,
//   connectionsByIP: 30
// }
```

### Stale Connection Cleanup

Automatic cleanup runs every 5 minutes:
- Removes connections without ping for 5+ minutes
- Logs cleanup statistics
- Prevents memory leaks

## Multi-Server Deployment

### Setup

1. **Deploy multiple server instances** behind a load balancer
2. **Configure shared Redis** instance
3. **Set REDIS_URL** environment variable
4. **Enable sticky sessions** (optional, for better performance)

### Load Balancer Configuration

For best results:
- Use **sticky sessions** (session affinity)
- Enable **WebSocket support**
- Configure **health checks** on `/health` endpoint

### Example: Nginx Configuration

```nginx
upstream backend {
    ip_hash;  # Sticky sessions
    server server1:3000;
    server server2:3000;
    server server3:3000;
}

server {
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Troubleshooting

### Connection Limit Exceeded

**Error**: "Maximum X connections per user exceeded"

**Solution**:
- Check for multiple tabs/devices connected
- Implement client-side connection management
- Increase limit if needed (not recommended)

### Redis Adapter Not Working

**Symptoms**: Events not reaching all servers

**Check**:
1. Redis is running and accessible
2. REDIS_URL is correctly configured
3. Firewall allows Redis connections
4. Check logs for Redis connection errors

### Stale Connections

**Symptoms**: Connections not cleaning up

**Solution**:
- Check ping/pong implementation on client
- Verify ping interval configuration
- Check for network issues causing missed pings

## Performance Considerations

### Single Server Mode
- **Best for**: Development, small deployments
- **Limitations**: No horizontal scaling
- **Performance**: Excellent for < 1000 concurrent connections

### Multi-Server Mode (Redis)
- **Best for**: Production, high-traffic deployments
- **Benefits**: Horizontal scaling, high availability
- **Overhead**: Redis pub/sub adds ~1-2ms latency per event
- **Performance**: Scales to 10,000+ concurrent connections

## Best Practices

1. **Monitor connection counts** - Track per user/company/IP
2. **Set appropriate limits** - Balance between usability and resource usage
3. **Implement client reconnection** - Handle disconnects gracefully
4. **Use Redis in production** - Enable multi-server scaling
5. **Monitor Redis health** - Ensure Redis is available and performant
6. **Cleanup on client disconnect** - Always cleanup resources client-side

## Future Enhancements

Potential improvements:
- **Connection pooling** - Reuse connections efficiently
- **Rate limiting** - Limit events per connection
- **Metrics export** - Export connection stats to monitoring
- **Auto-scaling** - Scale servers based on connection count
- **Geographic distribution** - Multi-region Redis setup
