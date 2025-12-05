import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "../client";
import { membershipsCache } from "../drizzle-schema";
import type { MembershipCache, NewMembershipCache } from "../types";

export const MembershipService = {
  async create(data: NewMembershipCache): Promise<MembershipCache> {
    const [result] = await db.insert(membershipsCache).values(data).returning();
    if (!result) throw new Error("Failed to create membership");
    return result;
  },

  async get(id: string): Promise<MembershipCache | null> {
    const [result] = await db
      .select()
      .from(membershipsCache)
      .where(eq(membershipsCache.id, id))
      .limit(1);
    return result || null;
  },

  async getByMemberAndCreator(
    memberWallet: string,
    creatorWallet: string
  ): Promise<MembershipCache | null> {
    const [result] = await db
      .select()
      .from(membershipsCache)
      .where(
        and(
          eq(membershipsCache.memberWallet, memberWallet),
          eq(membershipsCache.creatorWallet, creatorWallet)
        )
      )
      .orderBy(desc(membershipsCache.expiryTime))
      .limit(1);
    return result || null;
  },

  async listByMember(memberWallet: string): Promise<MembershipCache[]> {
    return db
      .select()
      .from(membershipsCache)
      .where(eq(membershipsCache.memberWallet, memberWallet))
      .orderBy(desc(membershipsCache.expiryTime));
  },

  async listActiveByMember(memberWallet: string): Promise<MembershipCache[]> {
    return db
      .select()
      .from(membershipsCache)
      .where(
        and(
          eq(membershipsCache.memberWallet, memberWallet),
          gt(membershipsCache.expiryTime, new Date())
        )
      )
      .orderBy(desc(membershipsCache.expiryTime));
  },

  async listByCreator(creatorWallet: string): Promise<MembershipCache[]> {
    return db
      .select()
      .from(membershipsCache)
      .where(eq(membershipsCache.creatorWallet, creatorWallet))
      .orderBy(desc(membershipsCache.createdAt));
  },

  async listActiveByCreator(creatorWallet: string): Promise<MembershipCache[]> {
    return db
      .select()
      .from(membershipsCache)
      .where(
        and(
          eq(membershipsCache.creatorWallet, creatorWallet),
          gt(membershipsCache.expiryTime, new Date())
        )
      )
      .orderBy(desc(membershipsCache.expiryTime));
  },

  async update(id: string, data: Partial<NewMembershipCache>): Promise<MembershipCache | null> {
    const [result] = await db
      .update(membershipsCache)
      .set({ ...data, syncedAt: new Date() })
      .where(eq(membershipsCache.id, id))
      .returning();
    return result || null;
  },

  async syncFromBlockchain(
    memberWallet: string,
    creatorWallet: string,
    data: Partial<NewMembershipCache>
  ): Promise<MembershipCache> {
    const existing = await this.getByMemberAndCreator(memberWallet, creatorWallet);

    if (existing) {
      const [result] = await db
        .update(membershipsCache)
        .set({ ...data, syncedAt: new Date() })
        .where(eq(membershipsCache.id, existing.id))
        .returning();
      if (!result) throw new Error("Failed to update membership");
      return result;
    }

    const membershipData = data as NewMembershipCache;
    const [result] = await db
      .insert(membershipsCache)
      .values({
        ...membershipData,
        id: `${memberWallet}-${creatorWallet}`,
        memberWallet,
        creatorWallet,
        syncedAt: new Date(),
      })
      .returning();

    if (!result) throw new Error("Failed to create membership");
    return result;
  },

  async isActive(memberWallet: string, creatorWallet: string): Promise<boolean> {
    const membership = await this.getByMemberAndCreator(memberWallet, creatorWallet);
    if (!membership) return false;

    return membership.expiryTime > new Date();
  },

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(membershipsCache).where(eq(membershipsCache.id, id));
    return (result.rowCount ?? 0) > 0;
  },
};
