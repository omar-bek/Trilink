import { Request, Response, NextFunction } from 'express';
import { Role } from '../../../config/rbac';
import { logger } from '../../../utils/logger';
import { getRequestId } from '../../../utils/requestId';
import { PaymentRepository } from '../repository';

/**
 * Payment Ownership Middleware
 * Checks if user can access a payment by verifying:
 * - User's companyId matches payment.companyId (Buyer company) OR
 * - User's companyId matches payment.recipientCompanyId (Recipient company)
 * - Admin and Government bypass ownership checks
 */
export const requirePaymentOwnership = () => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'يجب تسجيل الدخول للوصول إلى هذا المورد.',
          requestId: getRequestId(req),
        });
        return;
      }

      const userRole = req.user.role as Role;
      const userCompanyId = req.user.companyId;

      // Admin and Government bypass ownership checks
      if (userRole === Role.ADMIN || userRole === Role.GOVERNMENT) {
        next();
        return;
      }

      // Ensure user has a companyId
      if (!userCompanyId) {
        logger.warn(
          `User ${req.user.userId} has no companyId - payment ownership violation`
        );
        res.status(403).json({
          success: false,
          error: 'User must belong to a company',
          message: 'يجب أن تكون عضوًا في شركة للوصول إلى هذا المورد.',
          requestId: getRequestId(req),
        });
        return;
      }

      // Get payment ID from route params
      const paymentId = req.params.id;
      if (!paymentId || paymentId === 'undefined' || paymentId === 'null') {
        res.status(400).json({
          success: false,
          error: 'Payment ID is required',
          message: 'معرف الدفع مطلوب.',
          requestId: getRequestId(req),
        });
        return;
      }

      // Validate that paymentId is a valid ObjectId format
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(paymentId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid payment ID format',
          message: 'صيغة معرف الدفع غير صحيحة.',
          requestId: getRequestId(req),
        });
        return;
      }

      // Fetch the payment (without populate to get raw ObjectIds)
      const paymentRepository = new PaymentRepository();
      const payment = await paymentRepository.findById(paymentId, false);
      
      if (!payment) {
        logger.warn(`Payment not found: ${paymentId}`);
        res.status(404).json({
          success: false,
          error: 'Payment not found',
          message: 'الدفع غير موجود.',
          requestId: getRequestId(req),
        });
        return;
      }

      // Check ownership - user must be from either the buyer company or recipient company
      // Handle both ObjectId and populated company objects
      const paymentCompanyId = payment.companyId;
      const paymentRecipientCompanyId = payment.recipientCompanyId;
      
      // Extract ID string - handle both ObjectId and populated objects
      const paymentCompanyIdStr = typeof paymentCompanyId === 'object' && paymentCompanyId !== null && '_id' in paymentCompanyId
        ? (paymentCompanyId as any)._id.toString()
        : paymentCompanyId.toString();
      
      const paymentRecipientCompanyIdStr = typeof paymentRecipientCompanyId === 'object' && paymentRecipientCompanyId !== null && '_id' in paymentRecipientCompanyId
        ? (paymentRecipientCompanyId as any)._id.toString()
        : paymentRecipientCompanyId.toString();
      
      const userCompanyIdStr = userCompanyId.toString();

      const isBuyerCompany = paymentCompanyIdStr === userCompanyIdStr;
      const isRecipientCompany = paymentRecipientCompanyIdStr === userCompanyIdStr;

      if (!isBuyerCompany && !isRecipientCompany) {
        logger.warn(
          `Payment ownership violation: User ${req.user.userId} (Company: ${userCompanyIdStr}) attempted to access Payment ${paymentId} (Buyer: ${paymentCompanyIdStr}, Recipient: ${paymentRecipientCompanyIdStr})`
        );
        res.status(403).json({
          success: false,
          error: 'Access denied: Payment belongs to different company',
          message: 'غير مسموح لك بالوصول إلى هذا الدفع. الدفع ينتمي إلى شركة أخرى.',
          requestId: getRequestId(req),
        });
        return;
      }

      // Store payment in request for use in controller
      (req as any).payment = payment;

      next();
    } catch (error) {
      logger.error('Payment ownership middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization error',
        message: 'حدث خطأ أثناء التحقق من ملكية الدفع. يرجى المحاولة مرة أخرى.',
        requestId: getRequestId(req),
      });
    }
  };
};
