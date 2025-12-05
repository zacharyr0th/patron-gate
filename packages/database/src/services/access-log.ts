import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../client";
import { accessLogs } from "../drizzle-schema";
import type { AccessLog, AccessType, NewAccessLog } from "../types";

export const AccessLogService = {
  async create(data: NewAccessLog): Promise<AccessLog> {
    const [result] = await db.insert(accessLogs).values(data).returning();
    if (!result) throw new Error("Failed to create access log");
    return result;
  },

  async listByContent(contentId: string, limit = 100, offset = 0): Promise<AccessLog[]> {
    return db
      .select()
      .from(accessLogs)
      .where(eq(accessLogs.contentId, contentId))
      .orderBy(desc(accessLogs.accessedAt))
      .limit(limit)
      .offset(offset);
  },

  async listByUser(userWallet: string, limit = 100, offset = 0): Promise<AccessLog[]> {
    return db
      .select()
      .from(accessLogs)
      .where(eq(accessLogs.userWallet, userWallet))
      .orderBy(desc(accessLogs.accessedAt))
      .limit(limit)
      .offset(offset);
  },

  async getAccessCount(contentId: string, accessType?: AccessType): Promise<number> {
    const conditions = [eq(accessLogs.contentId, contentId)];
    if (accessType) {
      conditions.push(eq(accessLogs.accessType, accessType));
    }

    const [result] = await db
      .select({ count: count() })
      .from(accessLogs)
      .where(and(...conditions));
    return result?.count ?? 0;
  },

  async logAccess(
    userWallet: string,
    contentId: string,
    accessType: AccessType,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AccessLog> {
    return this.create({
      id: `${userWallet}-${contentId}-${Date.now()}`,
      userWallet,
      contentId,
      accessType,
      ipAddress,
      userAgent,
    });
  },
};
