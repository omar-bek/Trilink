# Frontend Loading Failures - Diagnostic & Fix Guide

## Executive Summary

This document identifies all possible frontend loading failure patterns, their root causes, detection methods, and standardized fix patterns.

---

## 1. Common Failure Patterns Causing Infinite Loading

### 1.1 React Query `enabled` Condition Deadlocks

**Problem**: Queries with `enabled: !!user` or `enabled: !!id` can wait indefinitely if:
- User is `undefined` but auth initialization hasn't completed
- ID is `undefined` but component renders anyway
- Query key changes but enabled condition never becomes true

**Detection**:
```typescript
// Check if query is stuck in "disabled" state
const { isLoading, isFetching, status } = useQuery({...});
// If status === 'pending' and isLoading === false, query is disabled
```

**Fix Pattern**:
```typescript
// Add explicit timeout and fallback
enabled: !!user && !!user.id, // More specific check
// Add timeout
gcTime: 0, // Don't cache disabled queries
```

### 1.2 Missing Query Timeouts

**Problem**: Queries can hang indefinitely if API doesn't respond, especially on mobile networks.

**Detection**:
- Query stays in `isLoading: true` for > 30 seconds
- Network tab shows request pending indefinitely

**Fix Pattern**:
```typescript
// Add timeout to query
queryFn: async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    const result = await api.get('/endpoint', { signal: controller.signal });
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
```

### 1.3 Suspense Boundary Misuse

**Problem**: `RouteSuspense` only handles code-splitting, not React Query suspense. Queries can hang if:
- Suspense boundary is missing around query
- Fallback doesn't handle query errors

**Detection**:
- Page shows skeleton indefinitely
- No error state appears

**Fix Pattern**:
```typescript
// Use ErrorBoundary + Suspense together
<ErrorBoundary>
  <Suspense fallback={<PageSkeleton />}>
    <QueryErrorBoundary>
      <Component />
    </QueryErrorBoundary>
  </Suspense>
</ErrorBoundary>
```

### 1.4 Permission-Based API Failures (403)

**Problem**: 403 errors redirect but query remains in loading state, causing:
- Infinite loading spinner
- No error feedback to user
- Query cache polluted with failed state

**Detection**:
- Network tab shows 403 response
- Component shows loading but API returned error
- Query status is `error` but component doesn't handle it

**Fix Pattern**:
```typescript
// In query hook, handle 403 immediately
if (error?.response?.status === 403) {
  // Query should be marked as error, not loading
  // Component should show permission error, not loading
}
```

### 1.5 Promise Deadlocks in Token Refresh

**Problem**: Token refresh queue can deadlock if:
- Multiple requests trigger refresh simultaneously
- Refresh fails but queue isn't cleared
- Queue promise never resolves/rejects

**Detection**:
- All API requests hang after 401
- Network tab shows pending refresh request
- Console shows no error but requests don't complete

**Fix Pattern**:
```typescript
// Add timeout to refresh queue
const refreshPromise = refreshToken().catch(() => {
  // Clear queue on failure
  processQueue(new Error('Refresh failed'), null);
});
// Add timeout
setTimeout(() => {
  if (isRefreshing) {
    processQueue(new Error('Refresh timeout'), null);
  }
}, 10000);
```

### 1.6 Missing Fallback States

**Problem**: Components don't handle:
- Empty data arrays
- Partial data loads
- Stale data after error

**Detection**:
- Component renders with `undefined` data
- Empty list shows loading skeleton
- No "no data" message

**Fix Pattern**:
```typescript
// Always check for empty states
if (isLoading) return <PageSkeleton />;
if (error) return <ErrorState error={error} />;
if (!data || data.length === 0) return <EmptyState />;
```

### 1.7 Mobile-Specific Network Failures

**Problem**: Mobile networks have:
- Intermittent connectivity
- Slow/unreliable connections
- Background tab throttling

**Detection**:
- `navigator.onLine` is false
- Network requests timeout on mobile only
- Service worker cache issues

**Fix Pattern**:
```typescript
// Detect mobile and adjust timeouts
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const timeout = isMobile ? 60000 : 30000; // Longer timeout on mobile

// Check online status
if (!navigator.onLine) {
  // Show offline message, don't attempt request
}
```

---

## 2. How to Detect Each Failure

### 2.1 React Query DevTools

```typescript
// Install React Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Check query states:
// - status: 'pending' | 'error' | 'success'
// - fetchStatus: 'fetching' | 'paused' | 'idle'
// - If status='pending' and fetchStatus='idle' → query is disabled
```

### 2.2 Browser DevTools

**Network Tab**:
- Check request status (pending, failed, 403, 500)
- Check request timing (timeout > 30s)
- Check request headers (missing auth token)

**Console**:
- React Query logs query states
- API interceptor logs errors
- Check for unhandled promise rejections

### 2.3 Code Instrumentation

```typescript
// Add query state logging
useEffect(() => {
  if (isLoading && Date.now() - startTime > 30000) {
    console.warn('Query loading > 30s', { queryKey, status, fetchStatus });
  }
}, [isLoading, queryKey]);
```

---

## 3. Fix Patterns (Code-Level)

### 3.1 Standardized Query Hook Pattern

```typescript
export const useStandardQuery = <T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    timeout?: number;
    retry?: boolean;
  }
) => {
  const isMobile = useIsMobile();
  const timeout = options?.timeout || (isMobile ? 60000 : 30000);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      try {
        const result = await queryFn();
        clearTimeout(timeoutId);
        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        // Handle 403 immediately
        if (error?.response?.status === 403) {
          // Don't retry, mark as error immediately
          throw error;
        }
        throw error;
      }
    },
    enabled: options?.enabled !== false,
    retry: (failureCount, error) => {
      // Don't retry 4xx errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return options?.retry !== false && failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    // Critical: Don't throw errors, let components handle
    throwOnError: false,
  });
};
```

### 3.2 Standardized Page Component Pattern

```typescript
export const StandardPage = () => {
  const { data, isLoading, error, isError } = useStandardQuery(...);

  // Always handle loading first
  if (isLoading) {
    return <PageSkeleton />;
  }

  // Handle errors (including 403)
  if (isError) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  // Handle empty data
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return <EmptyState message="No data available" />;
  }

  // Render content
  return <Content data={data} />;
};
```

### 3.3 Enhanced QueryClient Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Timeout handling
      retry: (failureCount, error: any) => {
        // Don't retry 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry network errors up to 2 times
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      // Critical: Don't throw errors
      throwOnError: false,
      // Refetch on window focus only if stale
      refetchOnWindowFocus: false,
      // Network mode: prefer cache, fallback to network
      networkMode: 'online',
    },
    mutations: {
      throwOnError: false,
      retry: false,
    },
  },
});
```

---

## 4. Standardized Loading / Error / Empty State Strategy

### 4.1 Loading States

**Hierarchy**:
1. **Route Loading** (code-splitting): `<RouteSuspense>`
2. **Page Loading** (data fetching): `<PageSkeleton>`
3. **Component Loading** (partial data): `<ComponentSkeleton>`

**Usage**:
```typescript
// Route level
<RouteSuspense>
  <Page />
</RouteSuspense>

// Page level
if (isLoading) return <PageSkeleton />;

// Component level
{isLoading ? <ComponentSkeleton /> : <Content />}
```

### 4.2 Error States

**Hierarchy**:
1. **Network Error**: Show retry button
2. **Permission Error (403)**: Show "Access Denied" + contact admin
3. **Server Error (500)**: Show "Service Unavailable" + retry
4. **Client Error (400)**: Show validation errors

**Usage**:
```typescript
<ErrorState
  error={error}
  type={getErrorType(error)}
  onRetry={refetch}
  showRetry={errorType !== ErrorType.PERMISSION_ERROR}
/>
```

### 4.3 Empty States

**Types**:
1. **No Data**: "No items found"
2. **Filtered Empty**: "No results match your filters"
3. **Initial Empty**: "Get started by creating your first item"

**Usage**:
```typescript
<EmptyState
  message="No payments found"
  action={hasFilters ? "Try adjusting your filters" : "Create your first payment"}
  icon={<PaymentIcon />}
/>
```

---

## 5. Global Loading Recovery Mechanism

### 5.1 Query Timeout Monitor

```typescript
// Hook to monitor query timeouts
export const useQueryTimeoutMonitor = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const interval = setInterval(() => {
      const queries = queryClient.getQueryCache().getAll();
      queries.forEach((query) => {
        if (query.state.status === 'pending') {
          const startTime = query.state.dataUpdatedAt || Date.now();
          const elapsed = Date.now() - startTime;
          
          // If query pending > 30s, cancel it
          if (elapsed > 30000) {
            queryClient.cancelQueries({ queryKey: query.queryKey });
            // Mark as error
            queryClient.setQueryData(query.queryKey, (old: any) => {
              return {
                ...old,
                error: new Error('Query timeout'),
              };
            });
          }
        }
      });
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [queryClient]);
};
```

### 5.2 Global Error Recovery

```typescript
// Component to handle global query errors
export const GlobalQueryErrorRecovery = () => {
  const queryClient = useQueryClient();
  const [stuckQueries, setStuckQueries] = useState<QueryKey[]>([]);

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated') {
        const query = event.query;
        // Detect stuck queries
        if (
          query.state.status === 'pending' &&
          query.state.fetchStatus === 'idle' &&
          !query.state.dataUpdatedAt
        ) {
          // Query is disabled but component is waiting
          setStuckQueries((prev) => [...prev, query.queryKey]);
        }
      }
    });

    return unsubscribe;
  }, [queryClient]);

  // Auto-recover stuck queries
  useEffect(() => {
    stuckQueries.forEach((queryKey) => {
      const query = queryClient.getQueryCache().find({ queryKey });
      if (query && query.state.status === 'pending') {
        // Cancel and mark as error
        queryClient.cancelQueries({ queryKey });
        queryClient.setQueryError(queryKey, new Error('Query disabled but component waiting'));
      }
    });
  }, [stuckQueries, queryClient]);

  return null;
};
```

### 5.3 Network Status Recovery

```typescript
// Hook to handle network status changes
export const useNetworkRecovery = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = () => {
      // Refetch all stale queries when coming online
      queryClient.refetchQueries({ stale: true });
    };

    const handleOffline = () => {
      // Cancel all pending queries
      queryClient.cancelQueries();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient]);
};
```

---

## 6. Permission-Based API Failures

### 6.1 Enhanced 403 Handling

```typescript
// In API interceptor (already exists, but enhance it)
if (error.response?.status === 403) {
  // Immediately cancel all pending queries for this resource
  queryClient.cancelQueries({
    predicate: (query) => {
      const queryKey = query.queryKey as string[];
      return queryKey.some((key) => 
        typeof key === 'string' && key.includes(resourceType)
      );
    },
  });
  
  // Mark queries as error (not loading)
  queryClient.setQueriesData(
    { predicate: (query) => /* same predicate */ },
    (old: any) => ({
      ...old,
      error: new Error('Permission denied'),
      status: 'error',
    })
  );
  
  // Navigate to unauthorized (already done)
  navigateTo('/unauthorized', { replace: true });
}
```

### 6.2 Query Hook Permission Check

```typescript
// In query hooks, check permission before enabling
export const useProtectedQuery = <T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  requiredPermission?: string
) => {
  const { user, hasPermission } = useAuthStore();
  
  return useQuery({
    queryKey,
    queryFn,
    enabled: !!user && (!requiredPermission || hasPermission(requiredPermission)),
    // If permission check fails, don't even attempt query
    retry: false,
  });
};
```

---

## 7. Mobile-Specific Failures

### 7.1 Mobile Detection Hook

```typescript
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth < 768
      );
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};
```

### 7.2 Mobile-Optimized Query Configuration

```typescript
export const useMobileAwareQuery = <T>(config: UseQueryOptions<T>) => {
  const isMobile = useIsMobile();
  
  return useQuery({
    ...config,
    // Longer timeout on mobile
    retryDelay: (attemptIndex) => 
      Math.min(1000 * 2 ** attemptIndex, isMobile ? 60000 : 30000),
    // More retries on mobile (unreliable networks)
    retry: isMobile ? 3 : 2,
    // Don't refetch on focus on mobile (battery saving)
    refetchOnWindowFocus: !isMobile,
  });
};
```

### 7.3 Background Tab Throttling

```typescript
// Detect if tab is in background
export const useTabVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
};

// Pause queries when tab is hidden
export const useBackgroundAwareQuery = <T>(config: UseQueryOptions<T>) => {
  const isVisible = useTabVisibility();
  
  return useQuery({
    ...config,
    enabled: config.enabled !== false && isVisible,
    // Don't refetch when tab becomes visible (already paused)
    refetchOnWindowFocus: false,
  });
};
```

---

## 8. Acceptance Checklist

### 8.1 Query Configuration
- [ ] All queries have explicit `enabled` conditions
- [ ] All queries have timeout handling (30s desktop, 60s mobile)
- [ ] All queries handle 403 errors immediately (no retry)
- [ ] All queries use `throwOnError: false`
- [ ] All queries have appropriate `retry` logic (no retry for 4xx)

### 8.2 Component Error Handling
- [ ] All pages check `isLoading` before rendering
- [ ] All pages check `isError` and show error state
- [ ] All pages check for empty data and show empty state
- [ ] All pages handle permission errors (403) differently
- [ ] All pages have retry mechanism for recoverable errors

### 8.3 Loading States
- [ ] Route-level loading (code-splitting) handled
- [ ] Page-level loading (data fetching) handled
- [ ] Component-level loading (partial data) handled
- [ ] No infinite loading spinners (> 30s)

### 8.4 Error States
- [ ] Network errors show retry button
- [ ] Permission errors (403) show "Access Denied"
- [ ] Server errors (500) show "Service Unavailable"
- [ ] Client errors (400) show validation messages
- [ ] All errors are user-friendly (no stack traces)

### 8.5 Empty States
- [ ] Empty data shows "No items" message
- [ ] Filtered empty shows "No results" message
- [ ] Initial empty shows "Get started" message
- [ ] Empty states have actionable CTAs

### 8.6 Global Recovery
- [ ] Query timeout monitor active
- [ ] Stuck query detection and recovery
- [ ] Network status recovery (online/offline)
- [ ] Background tab handling

### 8.7 Mobile Support
- [ ] Mobile detection working
- [ ] Longer timeouts on mobile (60s)
- [ ] More retries on mobile (3 vs 2)
- [ ] Background tab throttling handled
- [ ] Offline mode detection

### 8.8 Permission Handling
- [ ] 403 errors cancel pending queries
- [ ] 403 errors mark queries as error (not loading)
- [ ] Permission checks before enabling queries
- [ ] Unauthorized page shows correct error message

### 8.9 Testing
- [ ] Test with network throttling (slow 3G)
- [ ] Test with network offline
- [ ] Test with invalid permissions (403)
- [ ] Test with server errors (500)
- [ ] Test with missing data (empty responses)
- [ ] Test on mobile devices
- [ ] Test with background tabs

---

## 9. Implementation Priority

1. **Critical (Do First)**:
   - Fix React Query `enabled` conditions
   - Add query timeouts
   - Fix 403 error handling (mark as error, not loading)
   - Add standardized error/empty states

2. **High Priority**:
   - Implement global query timeout monitor
   - Add mobile detection and optimized timeouts
   - Fix permission-based query cancellation

3. **Medium Priority**:
   - Add background tab handling
   - Enhance network recovery
   - Add query state logging

4. **Low Priority**:
   - Add query analytics
   - Add performance monitoring
   - Add user feedback collection

---

## 10. Monitoring & Alerts

### 10.1 Key Metrics to Monitor

- Query timeout rate (> 30s)
- Stuck query count (pending > 30s)
- 403 error rate
- Network error rate
- Average query duration
- Mobile vs desktop failure rates

### 10.2 Alert Thresholds

- Query timeout rate > 5%
- Stuck query count > 10
- 403 error rate > 2%
- Network error rate > 10%

---

## Conclusion

This diagnostic guide provides comprehensive coverage of all frontend loading failure patterns. Implementation should follow the priority order, with critical fixes applied first to prevent infinite loading states.
