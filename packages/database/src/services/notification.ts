import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../client";
import { notifications } from "../drizzle-schema";
import type { NewNotification, Notification, NotificationType } from "../types";

export const NotificationService = {
  async create(data: NewNotification): Promise<Notification> {
    const [result] = await db.insert(notifications).values(data).returning();
    if (!result) throw new Error("Failed to create notification");
    return result;
  },

  async get(id: string): Promise<Notification | null> {
    const [result] = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
    return result || null;
  },

  async listByUser(
    userId: string,
    filters: { unreadOnly?: boolean; limit?: number; offset?: number } = {}
  ): Promise<Notification[]> {
    const { unreadOnly, limit = 50, offset = 0 } = filters;

    if (unreadOnly) {
      return db
        .select()
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);
    }

    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async markAsRead(id: string): Promise<Notification | null> {
    const [result] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return result || null;
  },

  async markAllAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  },

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return (result.rowCount ?? 0) > 0;
  },

  async getUnreadCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return result?.count ?? 0;
  },

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
    metadata?: Record<string, unknown>
  ): Promise<Notification> {
    return this.create({
      id: `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      userId,
      type,
      title,
      message,
      link,
      metadata,
      read: false,
    });
  },
};
