import { desc, eq, sql } from "drizzle-orm";
import { db } from "../client";
import { users } from "../drizzle-schema";
import type { NewUser, User } from "../types";

export const UserService = {
  async create(data: NewUser): Promise<User> {
    const [result] = await db.insert(users).values(data).returning();
    if (!result) throw new Error("Failed to create user");
    return result;
  },

  async get(id: string): Promise<User | null> {
    const [result] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result || null;
  },

  async getByWallet(walletAddress: string): Promise<User | null> {
    const [result] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.walletAddress}) = LOWER(${walletAddress})`)
      .limit(1);
    return result || null;
  },

  async update(id: string, data: Partial<NewUser>): Promise<User | null> {
    const [result] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result || null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  },

  async listCreators(limit = 50, offset = 0): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(eq(users.isCreator, true))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async promoteToCreator(id: string): Promise<User | null> {
    const [result] = await db
      .update(users)
      .set({ isCreator: true, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result || null;
  },

  async getOrCreate(walletAddress: string, userId: string): Promise<User> {
    const existing = await this.getByWallet(walletAddress);
    if (existing) return existing;

    return this.create({
      id: userId,
      walletAddress,
      isCreator: false,
    });
  },
};
