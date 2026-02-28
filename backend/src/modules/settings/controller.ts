import { Request, Response } from 'express';
import { SettingsService } from './service';
import { UpdateSettingsDto } from './types';
import { logger } from '../../utils/logger';

export class SettingsController {
  private service: SettingsService;

  constructor() {
    this.service = new SettingsService();
  }

  /**
   * Get all settings (admin only)
   * GET /api/settings
   */
  getSettings = async (_req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.service.getSettings();
      res.json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      logger.error('Error getting settings:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get settings',
      });
    }
  };

  /**
   * Get public settings (visible to all users)
   * GET /api/settings/public
   */
  getPublicSettings = async (_req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.service.getPublicSettings();
      res.json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      logger.error('Error getting public settings:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get public settings',
      });
    }
  };

  /**
   * Update settings (admin only)
   * PUT /api/settings
   */
  updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('PUT /api/settings called', { body: req.body });
      const data: UpdateSettingsDto = req.body;
      const settings = await this.service.updateSettings(data);
      res.json({
        success: true,
        data: settings,
        message: 'Settings updated successfully',
      });
    } catch (error: any) {
      logger.error('Error updating settings:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update settings',
      });
    }
  };
}
