import { desc, eq, like, sql } from "drizzle-orm";
import { db } from "../client";
import { creatorProfiles } from "../drizzle-schema";
import type { CreatorProfile, NewCreatorProfile } from "../types";

export const CreatorService = {
  async create(data: NewCreatorProfile): Promise<CreatorProfile> {
    const [result] = await db.insert(creatorProfiles).values(data).returning();
    if (!result) throw new Error("Failed to create creator profile");
    return result;
  },

  async get(userId: string): Promise<CreatorProfile | null> {
    const [result] = await db
      .select()
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, userId))
      .limit(1);
    return result || null;
  },

  async update(userId: string, data: Partial<NewCreatorProfile>): Promise<CreatorProfile | null> {
    const [result] = await db
      .update(creatorProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(creatorProfiles.userId, userId))
      .returning();
    return result || null;
  },

  async delete(userId: string): Promise<boolean> {
    const result = await db.delete(creatorProfiles).where(eq(creatorProfiles.userId, userId));
    return (result.rowCount ?? 0) > 0;
  },

  async list(
    filters: {
      category?: string;
      search?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<CreatorProfile[]> {
    const { category, search, limit = 50, offset = 0 } = filters;

    let query = db.select().from(creatorProfiles);

    if (category) {
      query = query.where(eq(creatorProfiles.category, category)) as typeof query;
    }

    if (search) {
      query = query.where(like(creatorProfiles.displayName, `%${search}%`)) as typeof query;
    }

    return query.orderBy(desc(creatorProfiles.totalMembers)).limit(limit).offset(offset);
  },

  async incrementTotalMembers(userId: string): Promise<void> {
    await db
      .update(creatorProfiles)
      .set({
        totalMembers: sql`${creatorProfiles.totalMembers} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(creatorProfiles.userId, userId));
  },

  async decrementTotalMembers(userId: string): Promise<void> {
    await db
      .update(creatorProfiles)
      .set({
        totalMembers: sql`${creatorProfiles.totalMembers} - 1`,
        updatedAt: new Date(),
      })
      .where(eq(creatorProfiles.userId, userId));
  },

  async addRevenue(userId: string, amount: string): Promise<void> {
    const profile = await this.get(userId);
    if (!profile) return;

    const currentRevenue = BigInt(profile.totalRevenue);
    const additionalRevenue = BigInt(amount);
    const newRevenue = (currentRevenue + additionalRevenue).toString();

    await db
      .update(creatorProfiles)
      .set({
        totalRevenue: newRevenue,
        updatedAt: new Date(),
      })
      .where(eq(creatorProfiles.userId, userId));
  },

  async getTopCreators(limit = 10): Promise<CreatorProfile[]> {
    return db
      .select()
      .from(creatorProfiles)
      .orderBy(desc(creatorProfiles.totalMembers))
      .limit(limit);
  },
};
