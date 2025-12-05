import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../client";
import { revenueEvents } from "../drizzle-schema";
import type { NewRevenueEvent, RevenueEvent, RevenueEventType } from "../types";

export const RevenueService = {
  async create(data: NewRevenueEvent): Promise<RevenueEvent> {
    const [result] = await db.insert(revenueEvents).values(data).returning();
    if (!result) throw new Error("Failed to create revenue event");
    return result;
  },

  async get(id: string): Promise<RevenueEvent | null> {
    const [result] = await db.select().from(revenueEvents).where(eq(revenueEvents.id, id)).limit(1);
    return result || null;
  },

  async listByCreator(
    creatorWallet: string,
    filters: {
      eventType?: RevenueEventType;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<RevenueEvent[]> {
    const { eventType, startDate, endDate, limit = 100, offset = 0 } = filters;

    let conditions = [eq(revenueEvents.creatorWallet, creatorWallet)];

    if (eventType) {
      conditions.push(eq(revenueEvents.eventType, eventType));
    }

    if (startDate) {
      conditions.push(gte(revenueEvents.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(revenueEvents.createdAt, endDate));
    }

    return db
      .select()
      .from(revenueEvents)
      .where(and(...conditions))
      .orderBy(desc(revenueEvents.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async listByMember(memberWallet: string, limit = 100, offset = 0): Promise<RevenueEvent[]> {
    return db
      .select()
      .from(revenueEvents)
      .where(eq(revenueEvents.memberWallet, memberWallet))
      .orderBy(desc(revenueEvents.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async getTotalRevenue(creatorWallet: string): Promise<string> {
    const [result] = await db
      .select({ total: sql<string>`COALESCE(SUM(CAST(${revenueEvents.amount} AS BIGINT)), 0)` })
      .from(revenueEvents)
      .where(
        and(
          eq(revenueEvents.creatorWallet, creatorWallet),
          eq(revenueEvents.eventType, "membership_purchase" as RevenueEventType)
        )
      );

    return result?.total ?? "0";
  },

  async getRevenueByPeriod(creatorWallet: string, startDate: Date, endDate: Date): Promise<string> {
    const events = await db
      .select()
      .from(revenueEvents)
      .where(
        and(
          eq(revenueEvents.creatorWallet, creatorWallet),
          gte(revenueEvents.createdAt, startDate),
          lte(revenueEvents.createdAt, endDate)
        )
      );

    const total = events.reduce((sum, event) => {
      if (event.eventType === "withdrawal") {
        return sum - BigInt(event.amount);
      }
      return sum + BigInt(event.amount);
    }, BigInt(0));

    return total.toString();
  },

  async recordPurchase(
    creatorWallet: string,
    memberWallet: string,
    amount: string,
    tierId: number,
    transactionHash?: string
  ): Promise<RevenueEvent> {
    return this.create({
      id: transactionHash || `${memberWallet}-${Date.now()}`,
      creatorWallet,
      memberWallet,
      amount,
      eventType: "membership_purchase",
      tierId,
      transactionHash,
    });
  },
};
