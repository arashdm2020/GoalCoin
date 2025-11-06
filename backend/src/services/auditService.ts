import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuditService {
  static async log(params: {
    action: string;
    entity_type: string;
    entity_id: string;
    user_wallet?: string;
    admin_user?: string;
    old_data?: any;
    new_data?: any;
  }) {
    try {
      await (prisma as any).auditLog.create({
        data: {
          action: params.action,
          entity_type: params.entity_type,
          entity_id: params.entity_id,
          user_wallet: params.user_wallet,
          admin_user: params.admin_user,
          old_data: params.old_data ? JSON.parse(JSON.stringify(params.old_data)) : null,
          new_data: params.new_data ? JSON.parse(JSON.stringify(params.new_data)) : null,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging should not break main functionality
    }
  }

  static async getAuditLogs(entity_type?: string, entity_id?: string, limit = 100) {
    return (prisma as any).auditLog.findMany({
      where: {
        ...(entity_type && { entity_type }),
        ...(entity_id && { entity_id }),
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }
}
