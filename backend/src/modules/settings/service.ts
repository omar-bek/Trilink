import { SettingsRepository } from './repository';
import { UpdateSettingsDto } from './types';
import { ISettings } from './schema';

export class SettingsService {
  private repository: SettingsRepository;

  constructor() {
    this.repository = new SettingsRepository();
  }

  /**
   * Get all settings (admin only)
   */
  async getSettings(): Promise<ISettings> {
    const settings = await this.repository.getSettings();
    if (!settings) {
      throw new Error('Settings not found');
    }
    return settings;
  }

  /**
   * Get public settings (visible to all users)
   */
  async getPublicSettings(): Promise<Partial<ISettings>> {
    return this.repository.getPublicSettings();
  }

  /**
   * Update settings
   */
  async updateSettings(data: UpdateSettingsDto): Promise<ISettings> {
    return this.repository.updateSettings(data);
  }
}
