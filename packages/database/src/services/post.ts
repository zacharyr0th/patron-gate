import { and, desc, eq } from "drizzle-orm";
import { db } from "../client";
import { posts } from "../drizzle-schema";
import type { NewPost, Post } from "../types";

export const PostService = {
  async create(data: NewPost): Promise<Post> {
    const [result] = await db.insert(posts).values(data).returning();
    if (!result) throw new Error("Failed to create post");
    return result;
  },

  async get(id: string): Promise<Post | null> {
    const [result] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    return result || null;
  },

  async listByCreator(
    creatorId: string,
    filters: { isPublic?: boolean; limit?: number; offset?: number } = {}
  ): Promise<Post[]> {
    const { isPublic, limit = 50, offset = 0 } = filters;

    if (isPublic !== undefined) {
      return db
        .select()
        .from(posts)
        .where(and(eq(posts.creatorId, creatorId), eq(posts.isPublic, isPublic)))
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);
    }

    return db
      .select()
      .from(posts)
      .where(eq(posts.creatorId, creatorId))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async listPublic(limit = 50, offset = 0): Promise<Post[]> {
    return db
      .select()
      .from(posts)
      .where(eq(posts.isPublic, true))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async update(id: string, data: Partial<NewPost>): Promise<Post | null> {
    const [result] = await db
      .update(posts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return result || null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id));
    return (result.rowCount ?? 0) > 0;
  },

  async canAccess(postId: string, userTierId?: number): Promise<boolean> {
    const post = await this.get(postId);
    if (!post) return false;

    if (post.isPublic) return true;

    if (!post.tierRequirement) return true;

    if (!userTierId) return false;

    return userTierId >= post.tierRequirement;
  },
};
