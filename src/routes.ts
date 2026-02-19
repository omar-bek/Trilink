import { Router } from 'express';
import authRoutes from './modules/auth/routes';
import userRoutes from './modules/users/routes';
import companyRoutes from './modules/companies/routes';
import purchaseRequestRoutes from './modules/purchase-requests/routes';
import rfqRoutes from './modules/rfqs/routes';
import bidRoutes from './modules/bids/routes';
import contractRoutes from './modules/contracts/routes';
import shipmentRoutes from './modules/shipments/routes';
import paymentRoutes from './modules/payments/routes';
import disputeRoutes from './modules/disputes/routes';
import analyticsRoutes from './modules/analytics/routes';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/purchase-requests', purchaseRequestRoutes);
router.use('/rfqs', rfqRoutes);
router.use('/bids', bidRoutes);
router.use('/contracts', contractRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/payments', paymentRoutes);
router.use('/disputes', disputeRoutes);
router.use('/analytics', analyticsRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TriLink Platform API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
