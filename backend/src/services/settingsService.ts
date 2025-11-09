import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class SettingsService {
  async getSetting(key: string): Promise<string | null> {
    const setting = await prisma.$queryRaw<any[]>`
      SELECT value FROM app_settings WHERE key = ${key}
    `;
    return setting.length > 0 ? setting[0].value : null;
  }

  async getAllSettings(): Promise<any[]> {
    return await prisma.$queryRaw`
      SELECT * FROM app_settings ORDER BY key
    `;
  }

  async updateSetting(key: string, value: string, updatedBy?: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE app_settings 
      SET value = ${value}, updated_at = NOW(), updated_by = ${updatedBy}
      WHERE key = ${key}
    `;
  }

  async getCountdownSettings(): Promise<any> {
    const settings = await prisma.$queryRaw<any[]>`
      SELECT key, value FROM app_settings 
      WHERE key LIKE 'countdown_%'
    `;

    const result: any = {};
    settings.forEach(s => {
      result[s.key] = s.value;
    });

    return {
      targetDate: result.countdown_target_date || null,
      title: result.countdown_title || 'Launch Countdown',
      enabled: result.countdown_enabled === 'true'
    };
  }
}

export const settingsService = new SettingsService();
