# Frontend Loading Failures - Acceptance Checklist

## Testing Checklist

Use this checklist to verify all loading failure fixes are working correctly.

---

## 1. Query Configuration Tests

### 1.1 Timeout Handling
- [ ] **Test**: Create a query that takes > 30s (desktop) or > 60s (mobile)
- [ ] **Expected**: Query is cancelled and shows timeout error after timeout period
- [ ] **Verify**: No infinite loading spinner
- [ ] **Location**: `QueryTimeoutMonitor` component active

### 1.2 Retry Logic
- [ ] **Test**: Simulate network error (disconnect network, make request)
- [ ] **Expected**: Query retries up to 2 times (desktop) or 3 times (mobile)
- [ ] **Verify**: Retry uses exponential backoff
- [ ] **Location**: `standardRetry` function in `queryUtils.ts`

### 1.3 Client Error Handling (4xx)
- [ ] **Test**: Make request that returns 400, 401, 403, 404
- [ ] **Expected**: No retry attempts, error shown immediately
- [ ] **Verify**: Query status is 'error', not 'pending'
- [ ] **Location**: `standardRetry` function

### 1.4 Enabled Conditions
- [ ] **Test**: Query with `enabled: !!user` when user is undefined
- [ ] **Expected**: Query doesn't run, no loading state
- [ ] **Verify**: `QueryTimeoutMonitor` detects and cancels stuck queries
- [ ] **Location**: All hooks using `enabled` conditions

---

## 2. Component Error Handling Tests

### 2.1 Loading States
- [ ] **Test**: Navigate to any list page (Payments, RFQs, etc.)
- [ ] **Expected**: Shows `PageSkeleton` while loading
- [ ] **Verify**: Skeleton appears immediately, not after delay
- [ ] **Location**: All list pages

### 2.2 Error States
- [ ] **Test**: Simulate API error (500, network error)
- [ ] **Expected**: Shows `ErrorHandler` component with retry button
- [ ] **Verify**: Error message is user-friendly (no stack traces)
- [ ] **Location**: All pages using `ErrorHandler`

### 2.3 Permission Errors (403)
- [ ] **Test**: Access resource without permission
- [ ] **Expected**: Redirects to `/unauthorized` page
- [ ] **Verify**: Query is marked as error, not loading
- [ ] **Verify**: No infinite loading spinner
- [ ] **Location**: API interceptor + all protected routes

### 2.4 Empty States
- [ ] **Test**: Navigate to list page with no data
- [ ] **Expected**: Shows `EmptyState` component
- [ ] **Verify**: Message is appropriate (no data vs filtered empty)
- [ ] **Location**: All list pages

---

## 3. Global Recovery Tests

### 3.1 Query Timeout Monitor
- [ ] **Test**: Create query that hangs (mock slow API)
- [ ] **Expected**: `QueryTimeoutMonitor` cancels query after timeout
- [ ] **Verify**: Query status changes to 'error' with timeout message
- [ ] **Location**: `QueryTimeoutMonitor` component

### 3.2 Network Recovery
- [ ] **Test**: Go offline, then online
- [ ] **Expected**: Pending queries cancelled when offline
- [ ] **Expected**: Stale queries refetched when online
- [ ] **Verify**: No queries hang in offline state
- [ ] **Location**: `NetworkRecovery` component

### 3.3 Stuck Query Detection
- [ ] **Test**: Query with `enabled: false` but component waiting
- [ ] **Expected**: `QueryTimeoutMonitor` detects and cancels
- [ ] **Verify**: Query marked as error with appropriate message
- [ ] **Location**: `QueryTimeoutMonitor` component

---

## 4. Mobile-Specific Tests

### 4.1 Mobile Detection
- [ ] **Test**: Open app on mobile device or resize to < 768px
- [ ] **Expected**: `useIsMobile` returns `true`
- [ ] **Verify**: Longer timeouts (60s) applied
- [ ] **Location**: `useIsMobile` hook

### 4.2 Mobile Timeouts
- [ ] **Test**: Slow network on mobile (throttle to 3G)
- [ ] **Expected**: Queries timeout after 60s (not 30s)
- [ ] **Verify**: More retries (3 vs 2)
- [ ] **Location**: `queryUtils.ts` timeout logic

### 4.3 Background Tab Handling
- [ ] **Test**: Switch to another tab, then back
- [ ] **Expected**: Queries don't refetch on focus (battery saving)
- [ ] **Verify**: No unnecessary network requests
- [ ] **Location**: QueryClient `refetchOnWindowFocus: false`

---

## 5. Permission-Based Failure Tests

### 5.1 403 Error Handling
- [ ] **Test**: Access resource without permission
- [ ] **Expected**: API interceptor redirects to `/unauthorized`
- [ ] **Expected**: Query is marked as error immediately
- [ ] **Verify**: No loading spinner after 403
- [ ] **Location**: API interceptor in `api.ts`

### 5.2 Permission Check Before Query
- [ ] **Test**: Query with permission check that fails
- [ ] **Expected**: Query doesn't run (`enabled: false`)
- [ ] **Verify**: No network request made
- [ ] **Location**: Hooks using permission checks

---

## 6. Integration Tests

### 6.1 Full Page Load
- [ ] **Test**: Navigate to Dashboard
- [ ] **Expected**: Shows skeleton → loads data → shows content
- [ ] **Verify**: No infinite loading
- [ ] **Verify**: Error handling works if API fails

### 6.2 List Page with Filters
- [ ] **Test**: Navigate to Payments, apply filter with no results
- [ ] **Expected**: Shows empty state with appropriate message
- [ ] **Verify**: No loading spinner
- [ ] **Location**: `PaymentList` and other list pages

### 6.3 Detail Page with Missing ID
- [ ] **Test**: Navigate to `/payments/undefined`
- [ ] **Expected**: Redirects to list page or shows error
- [ ] **Verify**: No infinite loading
- [ ] **Location**: Detail pages

---

## 7. Edge Cases

### 7.1 Rapid Navigation
- [ ] **Test**: Quickly navigate between pages
- [ ] **Expected**: Previous page queries are cancelled
- [ ] **Verify**: No memory leaks
- [ ] **Verify**: No queries from previous page complete

### 7.2 Multiple Simultaneous Requests
- [ ] **Test**: Trigger multiple queries at once
- [ ] **Expected**: All queries complete or timeout appropriately
- [ ] **Verify**: No deadlocks
- [ ] **Verify**: No race conditions

### 7.3 Token Refresh During Query
- [ ] **Test**: Make request, token expires, refresh happens
- [ ] **Expected**: Request is queued, retried after refresh
- [ ] **Verify**: No failed requests due to expired token
- [ ] **Location**: API interceptor token refresh logic

---

## 8. Performance Tests

### 8.1 Query Cache
- [ ] **Test**: Navigate away and back to same page
- [ ] **Expected**: Uses cached data if fresh (< 5 min)
- [ ] **Verify**: No unnecessary network requests
- [ ] **Location**: QueryClient `staleTime` configuration

### 8.2 Memory Usage
- [ ] **Test**: Navigate through many pages
- [ ] **Expected**: Old queries are garbage collected
- [ ] **Verify**: No memory leaks
- [ ] **Location**: QueryClient `gcTime` configuration

---

## 9. User Experience Tests

### 9.1 Loading Feedback
- [ ] **Test**: All loading states show appropriate feedback
- [ ] **Expected**: Skeleton loaders, not just spinners
- [ ] **Verify**: No blank screens during loading

### 9.2 Error Messages
- [ ] **Test**: All errors show user-friendly messages
- [ ] **Expected**: No stack traces or technical errors
- [ ] **Verify**: Actionable error messages (retry buttons, etc.)

### 9.3 Empty States
- [ ] **Test**: All empty states are helpful
- [ ] **Expected**: Clear messages and actionable CTAs
- [ ] **Verify**: Different messages for different scenarios

---

## 10. Browser Compatibility

### 10.1 Chrome/Edge
- [ ] **Test**: All features work in Chrome/Edge
- [ ] **Expected**: No console errors
- [ ] **Verify**: All loading/error states work

### 10.2 Firefox
- [ ] **Test**: All features work in Firefox
- [ ] **Expected**: No console errors
- [ ] **Verify**: All loading/error states work

### 10.3 Safari
- [ ] **Test**: All features work in Safari
- [ ] **Expected**: No console errors
- [ ] **Verify**: All loading/error states work
- [ ] **Note**: Safari has stricter cookie policies

### 10.4 Mobile Browsers
- [ ] **Test**: iOS Safari, Chrome Mobile
- [ ] **Expected**: All features work
- [ ] **Verify**: Touch interactions work
- [ ] **Verify**: Network recovery works

---

## 11. Monitoring & Alerts

### 11.1 Error Tracking
- [ ] **Test**: Verify errors are logged to Sentry (if configured)
- [ ] **Expected**: All unhandled errors are captured
- [ ] **Verify**: Error context is included

### 11.2 Performance Monitoring
- [ ] **Test**: Verify query durations are tracked
- [ ] **Expected**: Slow queries are identified
- [ ] **Verify**: Timeout queries are logged

---

## 12. Documentation

### 12.1 Code Comments
- [ ] **Verify**: All new utilities have JSDoc comments
- [ ] **Verify**: Complex logic is explained
- [ ] **Location**: All new files

### 12.2 Usage Examples
- [ ] **Verify**: Example usage in diagnostic document
- [ ] **Verify**: Patterns are documented
- [ ] **Location**: `LOADING_FAILURES_DIAGNOSTIC.md`

---

## Sign-Off

### Developer
- [ ] All tests passed
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] **Signature**: _________________ **Date**: ___________

### QA
- [ ] All tests passed
- [ ] Edge cases tested
- [ ] Browser compatibility verified
- [ ] **Signature**: _________________ **Date**: ___________

### Product Owner
- [ ] User experience verified
- [ ] Acceptance criteria met
- [ ] **Signature**: _________________ **Date**: ___________

---

## Notes

- Use browser DevTools Network tab to simulate slow networks
- Use React Query DevTools to inspect query states
- Test on actual mobile devices for best results
- Monitor console for warnings/errors during testing
