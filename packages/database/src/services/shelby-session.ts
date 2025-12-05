import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "../client";
import { shelbySessions } from "../drizzle-schema";
import type { NewShelbySession, ShelbySession } from "../types";

export const ShelbySessionService = {
  async create(data: NewShelbySession): Promise<ShelbySession> {
    const [result] = await db.insert(shelbySessions).values(data).returning();
    if (!result) throw new Error("Failed to create shelby session");
    return result;
  },

  async get(id: string): Promise<ShelbySession | null> {
    const [result] = await db
      .select()
      .from(shelbySessions)
      .where(eq(shelbySessions.id, id))
      .limit(1);
    return result || null;
  },

  async getValid(id: string): Promise<ShelbySession | null> {
    const [result] = await db
      .select()
      .from(shelbySessions)
      .where(and(eq(shelbySessions.id, id), gt(shelbySessions.expiresAt, new Date())))
      .limit(1);
    return result || null;
  },

  async consumeChunksets(id: string, count: number): Promise<boolean> {
    const session = await this.getValid(id);
    if (!session || session.chunksetsRemaining < count) {
      return false;
    }

    const [result] = await db
      .update(shelbySessions)
      .set({ chunksetsRemaining: session.chunksetsRemaining - count })
      .where(eq(shelbySessions.id, id))
      .returning();

    return !!result;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(shelbySessions).where(eq(shelbySessions.id, id));
    return (result.rowCount ?? 0) > 0;
  },

  async deleteExpired(): Promise<number> {
    const result = await db.delete(shelbySessions).where(lt(shelbySessions.expiresAt, new Date()));
    return result.rowCount ?? 0;
  },
};
