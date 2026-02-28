import { Settings, ISettings } from './schema';
import { UpdateSettingsDto } from './types';

export class SettingsRepository {
  /**
   * Get current settings (singleton - only one settings document)
   */
  async getSettings(): Promise<ISettings | null> {
    // Get the first (and only) settings document
    let settings = await Settings.findOne();

    // If no settings exist, create default settings
    if (!settings) {
      settings = await Settings.create({
        siteName: 'TriLink Platform',
        siteDescription: 'Government Procurement Platform',
        maintenanceMode: false,
        allowRegistration: true,
      });
    }

    return settings;
  }

  /**
   * Update settings
   */
  async updateSettings(data: UpdateSettingsDto): Promise<ISettings> {
    // Get existing settings or create new one
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create(data);
    } else {
      // Update only provided fields
      Object.assign(settings, data);
      await settings.save();
    }

    return settings;
  }

  /**
   * Get public settings (settings visible to all users)
   */
  async getPublicSettings(): Promise<Partial<ISettings>> {
    const settings = await this.getSettings();
    if (!settings) {
      return {
        siteName: 'TriLink Platform',
        siteDescription: 'Government Procurement Platform',
        logo: undefined,
        maintenanceMode: false,
        allowRegistration: true,
      };
    }

    return {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      logo: settings.logo,
      maintenanceMode: settings.maintenanceMode,
      allowRegistration: settings.allowRegistration,
    };
  }
}
