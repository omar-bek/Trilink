# Category Routing System - Deployment Checklist

## ✅ Pre-Deployment Verification

### 1. Database Configuration

- [x] Connection pool increased to 100
- [x] Indexes created automatically on startup
- [ ] Verify indexes exist: `db.purchaserequests.getIndexes()`
- [ ] Verify indexes exist: `db.companycategories.getIndexes()`
- [ ] Verify indexes exist: `db.categories.getIndexes()`

**Commands:**
```bash
# Connect to MongoDB
mongosh

# Check indexes
use trilink
db.purchaserequests.getIndexes()
db.companycategories.getIndexes()
db.categories.getIndexes()
```

### 2. Code Verification

- [x] N+1 queries fixed (aggregation pipeline)
- [x] Category filtering middleware applied
- [x] Event handlers registered
- [x] Queue service initialized
- [x] No linter errors
- [ ] Run tests: `npm test`
- [ ] Integration tests pass

### 3. Security Verification

- [x] List endpoints filtered by category
- [x] Inactive categories filtered
- [x] Deleted companies filtered
- [ ] Test: Supplier sees only their category PRs
- [ ] Test: Category deactivation blocks access
- [ ] Test: Company deletion removes from matching

### 4. Performance Verification

- [x] Aggregation pipeline implemented
- [x] Indexes created
- [x] Connection pool increased
- [ ] Load test: 100K companies, 1M PRs
- [ ] Verify P95 latency <500ms
- [ ] Monitor query execution times

### 5. Resilience Verification

- [x] Circuit breaker implemented
- [x] Retry logic implemented
- [x] Cache corruption detection
- [x] Multi-tier caching
- [ ] Test: Redis failure handling
- [ ] Test: Database connection failure
- [ ] Test: Cache corruption recovery

---

## 🚀 Deployment Steps

### Step 1: Database Migration

```bash
# 1. Backup database
mongodump --uri="mongodb://localhost:27017/trilink" --out=./backup

# 2. Create indexes (automatic on server start, or manual):
# Indexes are created automatically on server startup
# Or manually:
mongosh trilink
# Run: db.purchaserequests.createIndex({ categoryId: 1, status: 1, deletedAt: 1, createdAt: -1 })
```

### Step 2: Code Deployment

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Build TypeScript
npm run build

# 4. Run tests
npm test

# 5. Start server (indexes created automatically)
npm start
```

### Step 3: Verification

```bash
# 1. Check server logs for:
# - "✅ MongoDB connected successfully"
# - "✅ Category routing indexes created successfully"
# - "✅ Redis connected" (if Redis available)
# - "Category routing event handlers initialized"

# 2. Test endpoints:
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/category-routing/match?categoryId=xxx

# 3. Monitor performance:
# - Check query execution times
# - Monitor connection pool usage
# - Track cache hit rates
```

---

## 📊 Monitoring Checklist

### Metrics to Monitor

1. **Performance:**
   - Category routing query time (target: <500ms P95)
   - List endpoint response time (target: <200ms P95)
   - Connection pool usage (should stay <80%)

2. **Errors:**
   - Query timeouts
   - Connection pool exhaustion
   - Cache corruption detections
   - Circuit breaker openings

3. **Security:**
   - Access denied events
   - Category filtering violations
   - Unauthorized access attempts

### Alerts to Configure

- [ ] Query time >1 second
- [ ] Connection pool >90% usage
- [ ] Cache corruption detected
- [ ] Circuit breaker opened
- [ ] Error rate >1%

---

## 🔧 Rollback Plan

If issues occur:

1. **Immediate Rollback:**
   ```bash
   # Revert code
   git revert HEAD
   npm install
   npm run build
   npm start
   ```

2. **Database Rollback:**
   ```bash
   # Restore backup
   mongorestore --uri="mongodb://localhost:27017/trilink" ./backup/trilink
   ```

3. **Index Rollback:**
   ```bash
   # Remove new indexes if causing issues
   mongosh trilink
   db.purchaserequests.dropIndex("categoryId_status_deletedAt_createdAt")
   ```

---

## ✅ Post-Deployment Verification

### Day 1:
- [ ] Monitor error rates
- [ ] Check query performance
- [ ] Verify category filtering works
- [ ] Test event handlers

### Week 1:
- [ ] Review performance metrics
- [ ] Check cache hit rates
- [ ] Monitor connection pool
- [ ] Review security logs

### Month 1:
- [ ] Load test with production data
- [ ] Performance optimization review
- [ ] Security audit
- [ ] User feedback review

---

## 📝 Notes

- All fixes are backward compatible
- No data migration required
- Indexes created automatically on startup
- Event handlers are optional (system works without Redis)
- Circuit breaker prevents cascading failures

---

**Status:** ✅ **Ready for Testing**

**Next:** Run comprehensive tests before production deployment
