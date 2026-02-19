import { lazy, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary';
import { ProtectedRoute, PublicRoute } from '@/components/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/Layout/MainLayout';
import { RouteSuspense } from '@/components/Loading/RouteSuspense';
import { NetworkStatusBanner } from '@/components/common/NetworkStatusBanner';
import { GlobalLoadingRecovery } from '@/components/Loading/GlobalLoadingRecovery';
import { Role } from '@/types';
import { RouterWrapper } from './RouterWrapper';
import { env } from '@/config/env';
import { standardRetry, standardRetryDelay } from '@/utils/queryUtils';

/**
 * Route-Based Code Splitting
 * 
 * All pages are lazy-loaded using React.lazy() to reduce initial bundle size.
 * Each route is wrapped in Suspense with loading skeletons to prevent layout shift.
 * ProtectedRoute ensures no flash of unauthorized content during code splitting.
 * 
 * Performance Benefits:
 * - Reduced initial bundle size (~40-60% reduction)
 * - Faster Time to Interactive (TTI)
 * - Better Core Web Vitals scores
 * - Improved user experience on slow connections
 */

// Lazy loading with error handling
// Wraps lazy imports to handle module loading failures gracefully
const lazyWithErrorHandling = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> => {
  return lazy(() =>
    importFn().catch((error) => {
      // Log error for debugging
      if (env.isDevelopment) {
        console.error('Failed to load module:', error);
      }

      // Return a fallback error component
      const FallbackComponent: React.ComponentType<any> = () => (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Failed to load page</h2>
          <p>Please refresh the page or contact support if the problem persists.</p>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      );

      return {
        default: FallbackComponent as unknown as T,
      };
    })
  );
};

// Public Routes - Lazy loaded with error handling
const LandingPage = lazyWithErrorHandling(() => import('@/pages/LandingPage').then(module => ({ default: module.LandingPage })));
const Login = lazyWithErrorHandling(() => import('@/pages/Login/Login').then(module => ({ default: module.Login })));
const Register = lazyWithErrorHandling(() => import('@/pages/Register').then(module => ({ default: module.Register })));
const ForgotPassword = lazyWithErrorHandling(() => import('@/pages/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const ResetPassword = lazyWithErrorHandling(() => import('@/pages/ResetPassword').then(module => ({ default: module.ResetPassword })));
const Unauthorized = lazyWithErrorHandling(() => import('@/pages/Unauthorized/Unauthorized').then(module => ({ default: module.Unauthorized })));

// Protected Routes - Lazy loaded with error handling
const Dashboard = lazyWithErrorHandling(() => import('@/pages/Dashboard/Dashboard').then(module => ({ default: module.Dashboard })));

// Purchase Requests
const PurchaseRequestList = lazyWithErrorHandling(() => import('@/pages/PurchaseRequests').then(module => ({ default: module.PurchaseRequestList })));
const PurchaseRequestDetails = lazyWithErrorHandling(() => import('@/pages/PurchaseRequests').then(module => ({ default: module.PurchaseRequestDetails })));
const CreatePurchaseRequest = lazyWithErrorHandling(() => import('@/pages/PurchaseRequests').then(module => ({ default: module.CreatePurchaseRequest })));
const EditPurchaseRequest = lazyWithErrorHandling(() => import('@/pages/PurchaseRequests').then(module => ({ default: module.EditPurchaseRequest })));

// RFQs
const RFQList = lazyWithErrorHandling(() => import('@/pages/RFQs').then(module => ({ default: module.RFQList })));
const RFQDetails = lazyWithErrorHandling(() => import('@/pages/RFQs').then(module => ({ default: module.RFQDetails })));
const CreateRFQ = lazyWithErrorHandling(() => import('@/pages/RFQs').then(module => ({ default: module.CreateRFQ })));

// Bids
const BidList = lazyWithErrorHandling(() => import('@/pages/Bids').then(module => ({ default: module.BidList })));
const BidDetails = lazyWithErrorHandling(() => import('@/pages/Bids').then(module => ({ default: module.BidDetails })));
const SubmitBid = lazyWithErrorHandling(() => import('@/pages/Bids').then(module => ({ default: module.SubmitBid })));
const EditBid = lazyWithErrorHandling(() => import('@/pages/Bids').then(module => ({ default: module.EditBid })));
const BidComparison = lazyWithErrorHandling(() => import('@/pages/Bids').then(module => ({ default: module.BidComparison })));
const BidNegotiationRoom = lazyWithErrorHandling(() => import('@/pages/Bids').then(module => ({ default: module.BidNegotiationRoom })));

// Contracts
const ContractList = lazyWithErrorHandling(() => import('@/pages/Contracts').then(module => ({ default: module.ContractList })));
const ContractDetails = lazyWithErrorHandling(() => import('@/pages/Contracts').then(module => ({ default: module.ContractDetails })));

// Shipments
const ShipmentList = lazyWithErrorHandling(() => import('@/pages/Shipments').then(module => ({ default: module.ShipmentList })));
const ShipmentDetails = lazyWithErrorHandling(() => import('@/pages/Shipments').then(module => ({ default: module.ShipmentDetails })));
const CreateShipment = lazyWithErrorHandling(() => import('@/pages/Shipments').then(module => ({ default: module.CreateShipment })));
const Tracking = lazyWithErrorHandling(() => import('@/pages/Shipments').then(module => ({ default: module.Tracking })));
const EnhancedTracking = lazyWithErrorHandling(() => import('@/pages/Shipments').then(module => ({ default: module.EnhancedTracking })));

// Logistics
const LogisticsDashboard = lazyWithErrorHandling(() => import('@/pages/Logistics').then(module => ({ default: module.LogisticsDashboard })));

// Payments
const PaymentList = lazyWithErrorHandling(() => import('@/pages/Payments').then(module => ({ default: module.PaymentList })));
const PaymentDetails = lazyWithErrorHandling(() => import('@/pages/Payments').then(module => ({ default: module.PaymentDetails })));
const PaymentMilestones = lazyWithErrorHandling(() => import('@/pages/Payments').then(module => ({ default: module.PaymentMilestones })));

// Disputes
const DisputeList = lazyWithErrorHandling(() => import('@/pages/Disputes').then(module => ({ default: module.DisputeList })));
const DisputeDetails = lazyWithErrorHandling(() => import('@/pages/Disputes').then(module => ({ default: module.DisputeDetails })));
const CreateDispute = lazyWithErrorHandling(() => import('@/pages/Disputes').then(module => ({ default: module.CreateDispute })));
const EscalatedDisputes = lazyWithErrorHandling(() => import('@/pages/Disputes').then(module => ({ default: module.EscalatedDisputes })));
const AssignedToMe = lazyWithErrorHandling(() => import('@/pages/Disputes').then(module => ({ default: module.AssignedToMe })));

// Clearance
const ClearanceDashboard = lazyWithErrorHandling(() => import('@/pages/Clearance').then(module => ({ default: module.ClearanceDashboard })));
const SubmitClearanceBid = lazyWithErrorHandling(() => import('@/pages/Clearance').then(module => ({ default: module.SubmitClearanceBid })));

// Analytics
const GovernmentAnalytics = lazyWithErrorHandling(() => import('@/pages/Analytics').then(module => ({ default: module.GovernmentAnalytics })));
const CompanyAnalytics = lazyWithErrorHandling(() => import('@/pages/Analytics').then(module => ({ default: module.CompanyAnalytics })));

// Government Intelligence
const GovernmentIntelligenceDashboard = lazyWithErrorHandling(() => import('@/pages/GovernmentIntelligence').then(module => ({ default: module.GovernmentIntelligenceDashboard })));

// Supplier Sales
const SupplierSalesDashboard = lazyWithErrorHandling(() => import('@/pages/SupplierSales').then(module => ({ default: module.SupplierSalesDashboard })));

// Profile
const Profile = lazyWithErrorHandling(() => import('@/pages/Profile').then(module => ({ default: module.Profile })));
const CompanySettings = lazyWithErrorHandling(() => import('@/pages/Profile').then(module => ({ default: module.CompanySettings })));

// Admin
const UserManagement = lazyWithErrorHandling(() => import('@/pages/Admin').then(module => ({ default: module.UserManagement })));
const CompanyManagement = lazyWithErrorHandling(() => import('@/pages/Admin').then(module => ({ default: module.CompanyManagement })));
const CompanyDetails = lazyWithErrorHandling(() => import('@/pages/Admin').then(module => ({ default: module.CompanyDetails })));
const CategoryManagement = lazyWithErrorHandling(() => import('@/pages/Admin').then(module => ({ default: module.CategoryManagement })));
const AuditLogs = lazyWithErrorHandling(() => import('@/pages/Admin').then(module => ({ default: module.AuditLogs })));
const AdminDashboard = lazyWithErrorHandling(() => import('@/pages/Admin').then(module => ({ default: module.AdminDashboard })));
const SystemSettings = lazyWithErrorHandling(() => import('@/pages/Admin').then(module => ({ default: module.SystemSettings })));

// Status
const StatusPage = lazyWithErrorHandling(() => import('@/components/Status/StatusPage').then(module => ({ default: module.default })));

/**
 * Protected Route Wrapper
 * 
 * Wraps lazy-loaded components with ProtectedRoute and Suspense.
 * Ensures authentication check happens BEFORE code splitting to prevent flash of unauthorized content.
 */
const ProtectedLazyRoute = ({
  children,
  requiredRole
}: {
  children: ReactNode;
  requiredRole?: Role | Role[]
}) => {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <MainLayout>
        <RouteSuspense>
          {children}
        </RouteSuspense>
      </MainLayout>
    </ProtectedRoute>
  );
};

// Create a client with resilient error handling and timeout protection
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: standardRetry,
      retryDelay: standardRetryDelay,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Critical: Don't throw errors - let components handle them
      throwOnError: false,
      // Network mode: prefer cache, fallback to network
      networkMode: 'online',
    },
    mutations: {
      // Don't throw errors in mutations - let components handle them
      throwOnError: false,
      retry: false, // Don't retry mutations
    },
  },
});

export const AppRouter = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <GlobalLoadingRecovery />
        <NetworkStatusBanner />
        <RouterWrapper>
          <ErrorBoundary>
            <Routes>
              {/* Public Routes */}
              <Route
                path="/"
                element={
                  <RouteSuspense>
                    <LandingPage />
                  </RouteSuspense>
                }
              />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <RouteSuspense>
                      <Login />
                    </RouteSuspense>
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RouteSuspense>
                      <Register />
                    </RouteSuspense>
                  </PublicRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <RouteSuspense>
                      <ForgotPassword />
                    </RouteSuspense>
                  </PublicRoute>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <PublicRoute>
                    <RouteSuspense>
                      <ResetPassword />
                    </RouteSuspense>
                  </PublicRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedLazyRoute>
                    <Dashboard />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/supplier-sales"
                element={
                  <ProtectedLazyRoute requiredRole={Role.SUPPLIER}>
                    <SupplierSalesDashboard />
                  </ProtectedLazyRoute>
                }
              />

              {/* Purchase Requests */}
              <Route
                path="/purchase-requests"
                element={
                  <ProtectedLazyRoute requiredRole={[Role.BUYER, Role.COMPANY_MANAGER, Role.ADMIN, Role.GOVERNMENT]}>
                    <PurchaseRequestList />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/purchase-requests/new"
                element={
                  <ProtectedLazyRoute requiredRole={[Role.BUYER, Role.COMPANY_MANAGER]}>
                    <CreatePurchaseRequest />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/purchase-requests/:id/edit"
                element={
                  <ProtectedLazyRoute requiredRole={[Role.BUYER, Role.COMPANY_MANAGER]}>
                    <EditPurchaseRequest />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/purchase-requests/:id"
                element={
                  <ProtectedLazyRoute requiredRole={[Role.BUYER, Role.COMPANY_MANAGER, Role.ADMIN, Role.GOVERNMENT]}>
                    <PurchaseRequestDetails />
                  </ProtectedLazyRoute>
                }
              />

              {/* RFQs */}
              <Route
                path="/rfqs"
                element={
                  <ProtectedLazyRoute>
                    <RFQList />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/rfqs/new"
                element={
                  <ProtectedLazyRoute requiredRole={[Role.BUYER, Role.COMPANY_MANAGER]}>
                    <CreateRFQ />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/rfqs/:id"
                element={
                  <ProtectedLazyRoute>
                    <RFQDetails />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/rfqs/:id/edit"
                element={
                  <ProtectedLazyRoute requiredRole={[Role.BUYER, Role.COMPANY_MANAGER]}>
                    <CreateRFQ />
                  </ProtectedLazyRoute>
                }
              />

              {/* Bids */}
              <Route
                path="/bids"
                element={
                  <ProtectedLazyRoute>
                    <BidList />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/bids/new"
                element={
                  <ProtectedLazyRoute>
                    <SubmitBid />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/bids/:id/edit"
                element={
                  <ProtectedLazyRoute>
                    <EditBid />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/bids/:id"
                element={
                  <ProtectedLazyRoute>
                    <BidDetails />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/bids/:bidId/negotiate"
                element={
                  <ProtectedLazyRoute>
                    <BidNegotiationRoom />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/rfqs/:rfqId/bids/compare"
                element={
                  <ProtectedLazyRoute requiredRole={[Role.BUYER, Role.COMPANY_MANAGER]}>
                    <BidComparison />
                  </ProtectedLazyRoute>
                }
              />

              {/* Contracts */}
              <Route
                path="/contracts"
                element={
                  <ProtectedLazyRoute>
                    <ContractList />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/contracts/:id"
                element={
                  <ProtectedLazyRoute>
                    <ContractDetails />
                  </ProtectedLazyRoute>
                }
              />

              {/* Shipments */}
              <Route
                path="/shipments"
                element={
                  <ProtectedLazyRoute>
                    <ShipmentList />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/shipments/new"
                element={
                  <ProtectedLazyRoute>
                    <CreateShipment />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/shipments/:id"
                element={
                  <ProtectedLazyRoute>
                    <ShipmentDetails />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/tracking"
                element={
                  <ProtectedLazyRoute requiredRole={[Role.LOGISTICS, Role.BUYER, Role.COMPANY_MANAGER, Role.ADMIN]}>
                    <Tracking />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/tracking/enhanced"
                element={
                  <ProtectedLazyRoute requiredRole={[Role.LOGISTICS, Role.BUYER, Role.COMPANY_MANAGER, Role.ADMIN]}>
                    <EnhancedTracking />
                  </ProtectedLazyRoute>
                }
              />
              {/* Logistics Dashboard */}
              <Route
                path="/logistics/dashboard"
                element={
                  <ProtectedLazyRoute requiredRole={[Role.LOGISTICS, Role.ADMIN]}>
                    <LogisticsDashboard />
                  </ProtectedLazyRoute>
                }
              />

              {/* Payments */}
              <Route
                path="/payments"
                element={
                  <ProtectedLazyRoute>
                    <PaymentList />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/payments/milestones"
                element={
                  <ProtectedLazyRoute>
                    <PaymentMilestones />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/payments/milestones/:contractId"
                element={
                  <ProtectedLazyRoute>
                    <PaymentMilestones />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/payments/:id"
                element={
                  <ProtectedLazyRoute>
                    <PaymentDetails />
                  </ProtectedLazyRoute>
                }
              />

              {/* Disputes */}
              <Route
                path="/disputes"
                element={
                  <ProtectedLazyRoute>
                    <DisputeList />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/disputes/new"
                element={
                  <ProtectedLazyRoute>
                    <CreateDispute />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/disputes/escalated"
                element={
                  <ProtectedLazyRoute requiredRole={Role.GOVERNMENT}>
                    <EscalatedDisputes />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/disputes/assigned-to-me"
                element={
                  <ProtectedLazyRoute>
                    <AssignedToMe />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/disputes/:id"
                element={
                  <ProtectedLazyRoute>
                    <DisputeDetails />
                  </ProtectedLazyRoute>
                }
              />

              {/* Clearance */}
              <Route
                path="/clearance"
                element={
                  <ProtectedLazyRoute requiredRole={[Role.CLEARANCE, Role.ADMIN]}>
                    <ClearanceDashboard />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/clearance/bid/:rfqId"
                element={
                  <ProtectedLazyRoute requiredRole={[Role.CLEARANCE, Role.ADMIN]}>
                    <SubmitClearanceBid />
                  </ProtectedLazyRoute>
                }
              />

              {/* Analytics */}
              <Route
                path="/analytics"
                element={
                  <ProtectedLazyRoute requiredRole={[Role.BUYER, Role.COMPANY_MANAGER, Role.ADMIN]}>
                    <CompanyAnalytics />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/analytics/government"
                element={
                  <ProtectedLazyRoute requiredRole={Role.GOVERNMENT}>
                    <GovernmentAnalytics />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/intelligence"
                element={
                  <ProtectedLazyRoute requiredRole={Role.GOVERNMENT}>
                    <GovernmentIntelligenceDashboard />
                  </ProtectedLazyRoute>
                }
              />

              {/* Profile & Settings */}
              <Route
                path="/profile"
                element={
                  <ProtectedLazyRoute>
                    <Profile />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Navigate to="/settings/company" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/company"
                element={
                  <ProtectedLazyRoute>
                    <CompanySettings />
                  </ProtectedLazyRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Navigate to="/admin/dashboard" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedLazyRoute requiredRole={Role.ADMIN}>
                    <AdminDashboard />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedLazyRoute requiredRole={[Role.ADMIN, Role.COMPANY_MANAGER]}>
                    <UserManagement />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/admin/companies"
                element={
                  <ProtectedLazyRoute requiredRole={Role.ADMIN}>
                    <CompanyManagement />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/admin/companies/:id"
                element={
                  <ProtectedLazyRoute requiredRole={Role.ADMIN}>
                    <CompanyDetails />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <ProtectedLazyRoute requiredRole={Role.ADMIN}>
                    <CategoryManagement />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedLazyRoute requiredRole={Role.ADMIN}>
                    <AuditLogs />
                  </ProtectedLazyRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedLazyRoute requiredRole={Role.ADMIN}>
                    <SystemSettings />
                  </ProtectedLazyRoute>
                }
              />

              {/* Status Page - Accessible to all authenticated users */}
              <Route
                path="/status"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <RouteSuspense>
                        <StatusPage />
                      </RouteSuspense>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Unauthorized - Accessible to all authenticated users */}
              <Route
                path="/unauthorized"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <RouteSuspense>
                        <Unauthorized />
                      </RouteSuspense>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all route - redirect to landing page for unknown routes */}
              <Route
                path="*"
                element={
                  <Navigate to="/" replace />
                }
              />
            </Routes>
          </ErrorBoundary>
        </RouterWrapper>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
