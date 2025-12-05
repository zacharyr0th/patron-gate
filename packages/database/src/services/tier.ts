import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { membershipTiersCache } from "../drizzle-schema";
import type { MembershipTierCache, NewMembershipTierCache } from "../types";

export const TierService = {
  async create(data: NewMembershipTierCache): Promise<MembershipTierCache> {
    const [result] = await db.insert(membershipTiersCache).values(data).returning();
    if (!result) throw new Error("Failed to create tier");
    return result;
  },

  async get(id: string): Promise<MembershipTierCache | null> {
    const [result] = await db
      .select()
      .from(membershipTiersCache)
      .where(eq(membershipTiersCache.id, id))
      .limit(1);
    return result || null;
  },

  async getByCreatorAndTierId(
    creatorWallet: string,
    tierId: number
  ): Promise<MembershipTierCache | null> {
    const [result] = await db
      .select()
      .from(membershipTiersCache)
      .where(
        and(
          eq(membershipTiersCache.creatorWallet, creatorWallet),
          eq(membershipTiersCache.tierId, tierId)
        )
      )
      .limit(1);
    return result || null;
  },

  async listByCreator(creatorWallet: string): Promise<MembershipTierCache[]> {
    return db
      .select()
      .from(membershipTiersCache)
      .where(eq(membershipTiersCache.creatorWallet, creatorWallet))
      .orderBy(membershipTiersCache.tierId);
  },

  async listActive(creatorWallet: string): Promise<MembershipTierCache[]> {
    return db
      .select()
      .from(membershipTiersCache)
      .where(
        and(
          eq(membershipTiersCache.creatorWallet, creatorWallet),
          eq(membershipTiersCache.active, true)
        )
      )
      .orderBy(membershipTiersCache.tierId);
  },

  async update(
    id: string,
    data: Partial<NewMembershipTierCache>
  ): Promise<MembershipTierCache | null> {
    const [result] = await db
      .update(membershipTiersCache)
      .set({ ...data, syncedAt: new Date() })
      .where(eq(membershipTiersCache.id, id))
      .returning();
    return result || null;
  },

  async syncFromBlockchain(
    creatorWallet: string,
    tierId: number,
    data: Partial<NewMembershipTierCache>
  ): Promise<MembershipTierCache> {
    const existing = await this.getByCreatorAndTierId(creatorWallet, tierId);

    if (existing) {
      const [result] = await db
        .update(membershipTiersCache)
        .set({ ...data, syncedAt: new Date() })
        .where(eq(membershipTiersCache.id, existing.id))
        .returning();
      if (!result) throw new Error("Failed to update tier");
      return result;
    }

    const tierData = data as NewMembershipTierCache;
    const [result] = await db
      .insert(membershipTiersCache)
      .values({
        ...tierData,
        id: `${creatorWallet}-tier-${tierId}`,
        creatorWallet,
        tierId,
        syncedAt: new Date(),
      })
      .returning();

    if (!result) throw new Error("Failed to create tier");
    return result;
  },

  async deactivate(id: string): Promise<MembershipTierCache | null> {
    const [result] = await db
      .update(membershipTiersCache)
      .set({ active: false, syncedAt: new Date() })
      .where(eq(membershipTiersCache.id, id))
      .returning();
    return result || null;
  },
};
