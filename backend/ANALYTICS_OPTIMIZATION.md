# Analytics Service Optimization

This document describes the optimizations made to the analytics service for improved performance and scalability.

## Overview

The analytics service has been optimized with:
1. **MongoDB Aggregation Pipelines** - Efficient server-side data processing
2. **Redis Caching** - Fast response times for frequently accessed data
3. **Incremental Precomputed Metrics** - Background computation of metrics
4. **Date Range Filters** - Support for filtering analytics by date ranges
5. **Streaming Support** - Efficient handling of large datasets for export

## Architecture

### Components

1. **OptimizedAnalyticsService** (`service.optimized.ts`)
   - Uses aggregation pipelines for efficient data processing
   - Implements Redis caching layer
   - Supports date range filtering
   - Provides streaming capabilities

2. **Aggregation Pipelines** (`aggregations.ts`)
   - Pre-built aggregation pipelines for common analytics queries
   - Optimized for performance with proper indexing
   - Supports filtering by company, date range, and status

3. **Metrics Store** (`metrics-store.ts`)
   - Incremental metrics precomputation
   - Redis-based caching
   - Tracks last processed ID for incremental updates

4. **Cache Service** (`utils/cache.ts`)
   - Redis wrapper with fallback to no-op if Redis unavailable
   - Automatic serialization/deserialization
   - Pattern-based cache invalidation

5. **Metrics Scheduler** (`scheduler.ts`)
   - Background job that runs every 15 minutes
   - Incrementally updates precomputed metrics
   - Reduces load on real-time queries

## Features

### 1. Aggregation Pipelines

All analytics queries now use MongoDB aggregation pipelines instead of fetching all documents and processing in memory. This provides:

- **Better Performance**: Processing happens on the database server
- **Reduced Memory Usage**: Only aggregated results are returned
- **Leverages Indexes**: Aggregation pipelines can use indexes efficiently

Example:
```typescript
PurchaseRequest.aggregate([
  { $match: { deletedAt: null, createdAt: { $gte: startDate } } },
  {
    $group: {
      _id: '$status',
      count: { $sum: 1 },
    },
  },
])
```

### 2. Redis Caching

Analytics responses are cached in Redis with a 5-minute TTL:

- **Cache Key**: Includes scope (government/company) and filter parameters
- **Automatic Invalidation**: Cache is invalidated when data changes
- **Graceful Degradation**: Service continues to work if Redis is unavailable

Cache keys format:
- `analytics:government:{base64(filters)}`
- `analytics:company:{companyId}:{base64(filters)}`

### 3. Incremental Precomputed Metrics

Metrics are precomputed in the background and updated incrementally:

- **Initial Computation**: Full metrics computed on first run
- **Incremental Updates**: Only new records since last run are processed
- **Last Processed ID**: Tracks the last document ID processed
- **Scheduled Updates**: Runs every 15 minutes via cron job

Benefits:
- Faster response times for common queries
- Reduced database load
- Real-time data merged with precomputed metrics

### 4. Date Range Filters

All analytics endpoints now support date range filtering:

```typescript
GET /api/analytics/government?startDate=2024-01-01&endDate=2024-12-31
GET /api/analytics/company?startDate=2024-01-01&endDate=2024-12-31
```

Filters are applied at the database level using aggregation pipelines, ensuring optimal performance.

### 5. Streaming Support

Large datasets can be streamed for export/processing:

```typescript
GET /api/analytics/stream/purchase-requests?startDate=2024-01-01&endDate=2024-12-31
```

Streams use MongoDB cursors and Node.js Readable streams to handle large datasets efficiently without loading everything into memory.

## Performance Improvements

### Before Optimization
- Fetched all documents into memory
- Processed data in JavaScript
- No caching
- Slow for large datasets

### After Optimization
- Aggregation pipelines process data on database
- Redis caching for fast responses
- Incremental precomputation reduces load
- Streaming for large datasets
- **Expected improvement**: 10-100x faster for common queries

## Usage

### Basic Analytics (Cached)
```typescript
const analytics = await analyticsService.getGovernmentAnalytics();
```

### With Date Range Filter
```typescript
const analytics = await analyticsService.getGovernmentAnalytics({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
});
```

### Streaming Large Datasets
```typescript
const stream = analyticsService.streamPurchaseRequests({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
});

stream.pipe(response); // Stream to HTTP response
```

## Configuration

### Redis Configuration

Add to `.env`:
```env
REDIS_URL=redis://localhost:6379
```

Redis is optional - the service will continue to work without it (without caching).

### Metrics Scheduler

The scheduler runs automatically on server startup:
- Runs every 15 minutes
- Computes incremental metrics
- Stores in Redis cache

## Monitoring

### Cache Hit Rate
Monitor Redis cache hit rate to measure effectiveness:
```typescript
// Check cache statistics
const cached = await cache.get(key);
if (cached) {
  // Cache hit
}
```

### Query Performance
Use MongoDB explain to analyze aggregation pipeline performance:
```javascript
db.purchaserequests.aggregate([...]).explain("executionStats")
```

## Future Enhancements

1. **Materialized Views**: Pre-aggregated collections for very common queries
2. **Time-Series Collections**: For time-based analytics
3. **Partitioned Caching**: Different TTLs for different data types
4. **Query Result Compression**: Compress cached results for storage efficiency
5. **Distributed Caching**: Redis Cluster for high availability

## Troubleshooting

### Redis Connection Issues
- Service continues without Redis (no caching)
- Check Redis logs: `redis-cli monitor`
- Verify Redis URL in environment variables

### Slow Aggregation Queries
- Ensure indexes are created (see INDEXES.md)
- Use `explain()` to analyze query plans
- Consider adding compound indexes for common filter combinations

### Cache Invalidation
- Cache is automatically invalidated on data changes
- Manual invalidation: `analyticsService.invalidateCache(scope)`
- Pattern-based invalidation: `cache.deletePattern(pattern)`
