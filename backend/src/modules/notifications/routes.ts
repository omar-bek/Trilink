import { Router } from 'express';
import { InAppNotificationController } from './in-app.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new InAppNotificationController();

// All notification routes require authentication
router.use(authenticate);

// Get notifications
router.get('/', controller.getNotifications);

// Get unread count
router.get('/unread-count', controller.getUnreadCount);

// Mark notification as read
router.patch('/:id/read', controller.markAsRead);

// Mark all as read
router.patch('/read-all', controller.markAllAsRead);

// Delete notification
router.delete('/:id', controller.deleteNotification);

// Delete all notifications
router.delete('/', controller.deleteAllNotifications);

export default router;
