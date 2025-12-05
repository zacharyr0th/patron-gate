import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../client";
import { content as contentTable } from "../drizzle-schema";
import type { Content, NewContent } from "../types";

export const ContentService = {
  async create(data: NewContent): Promise<Content> {
    const [result] = await db.insert(contentTable).values(data).returning();
    if (!result) throw new Error("Failed to create content");
    return result;
  },

  async get(id: string): Promise<Content | null> {
    const [result] = await db.select().from(contentTable).where(eq(contentTable.id, id)).limit(1);
    return result || null;
  },

  async listByCreator(
    creatorId: string,
    filters: { isPublic?: boolean; limit?: number; offset?: number } = {}
  ): Promise<Content[]> {
    const { isPublic, limit = 50, offset = 0 } = filters;

    if (isPublic !== undefined) {
      return db
        .select()
        .from(contentTable)
        .where(and(eq(contentTable.creatorId, creatorId), eq(contentTable.isPublic, isPublic)))
        .orderBy(desc(contentTable.uploadedAt))
        .limit(limit)
        .offset(offset);
    }

    return db
      .select()
      .from(contentTable)
      .where(eq(contentTable.creatorId, creatorId))
      .orderBy(desc(contentTable.uploadedAt))
      .limit(limit)
      .offset(offset);
  },

  async listPublic(limit = 50, offset = 0): Promise<Content[]> {
    return db
      .select()
      .from(contentTable)
      .where(eq(contentTable.isPublic, true))
      .orderBy(desc(contentTable.uploadedAt))
      .limit(limit)
      .offset(offset);
  },

  async listAll(limit = 50, offset = 0): Promise<Content[]> {
    return db
      .select()
      .from(contentTable)
      .orderBy(desc(contentTable.uploadedAt))
      .limit(limit)
      .offset(offset);
  },

  async listByCreatorWallet(creatorWallet: string, limit = 50, offset = 0): Promise<Content[]> {
    return db
      .select()
      .from(contentTable)
      .where(eq(contentTable.creatorWallet, creatorWallet))
      .orderBy(desc(contentTable.uploadedAt))
      .limit(limit)
      .offset(offset);
  },

  async update(id: string, data: Partial<NewContent>): Promise<Content | null> {
    const [result] = await db
      .update(contentTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contentTable.id, id))
      .returning();
    return result || null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(contentTable).where(eq(contentTable.id, id));
    return (result.rowCount ?? 0) > 0;
  },

  async incrementStreamCount(id: string): Promise<void> {
    await db
      .update(contentTable)
      .set({
        streamCount: sql`${contentTable.streamCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(contentTable.id, id));
  },

  async incrementViewCount(id: string): Promise<void> {
    await db
      .update(contentTable)
      .set({
        viewCount: sql`${contentTable.viewCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(contentTable.id, id));
  },

  async canAccess(contentId: string, userTierId?: number): Promise<boolean> {
    const content = await this.get(contentId);
    if (!content) return false;

    if (content.isPublic) return true;

    if (!content.tierRequirement) return true;

    if (!userTierId) return false;

    return userTierId >= content.tierRequirement;
  },
};
