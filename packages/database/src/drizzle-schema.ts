import { boolean, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    walletAddress: text("wallet_address").notNull().unique(),
    username: text("username"),
    email: text("email"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    isCreator: boolean("is_creator").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    walletIdx: index("users_wallet_idx").on(table.walletAddress),
    creatorIdx: index("users_creator_idx").on(table.isCreator),
  })
);

export const creatorProfiles = pgTable(
  "creator_profiles",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    bannerUrl: text("banner_url"),
    socialLinks: jsonb("social_links").$type<{
      twitter?: string;
      instagram?: string;
      youtube?: string;
      website?: string;
    }>(),
    totalRevenue: text("total_revenue").notNull().default("0"),
    totalMembers: integer("total_members").notNull().default(0),
    category: text("category"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index("creator_profiles_category_idx").on(table.category),
  })
);

export const membershipTiersCache = pgTable(
  "membership_tiers_cache",
  {
    id: text("id").primaryKey(),
    creatorWallet: text("creator_wallet").notNull(),
    tierId: integer("tier_id").notNull(),
    name: text("name").notNull(),
    priceMonthly: text("price_monthly").notNull(),
    priceYearly: text("price_yearly").notNull(),
    benefits: jsonb("benefits").$type<string[]>().notNull(),
    maxMembers: integer("max_members").notNull(),
    currentMembers: integer("current_members").notNull().default(0),
    active: boolean("active").notNull().default(true),
    syncedAt: timestamp("synced_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    creatorIdx: index("tiers_creator_idx").on(table.creatorWallet),
    creatorTierIdx: index("tiers_creator_tier_idx").on(table.creatorWallet, table.tierId),
  })
);

export const membershipsCache = pgTable(
  "memberships_cache",
  {
    id: text("id").primaryKey(),
    memberWallet: text("member_wallet").notNull(),
    creatorWallet: text("creator_wallet").notNull(),
    tierId: integer("tier_id").notNull(),
    startTime: timestamp("start_time").notNull(),
    expiryTime: timestamp("expiry_time").notNull(),
    autoRenew: boolean("auto_renew").notNull().default(false),
    syncedAt: timestamp("synced_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    memberIdx: index("memberships_member_idx").on(table.memberWallet),
    creatorIdx: index("memberships_creator_idx").on(table.creatorWallet),
    memberCreatorIdx: index("memberships_member_creator_idx").on(
      table.memberWallet,
      table.creatorWallet
    ),
  })
);

export const posts = pgTable(
  "posts",
  {
    id: text("id").primaryKey(),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    postType: text("post_type").notNull().default("text"),
    tierRequirement: integer("tier_requirement"),
    isPublic: boolean("is_public").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    creatorIdx: index("posts_creator_idx").on(table.creatorId),
    publicIdx: index("posts_public_idx").on(table.isPublic),
    tierIdx: index("posts_tier_idx").on(table.tierRequirement),
  })
);

export const content = pgTable(
  "content",
  {
    id: text("id").primaryKey(),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    creatorWallet: text("creator_wallet").notNull(),

    title: text("title").notNull(),
    description: text("description"),
    contentType: text("content_type").notNull(),
    fileSize: integer("file_size").notNull(),
    duration: integer("duration"),
    tierRequirement: integer("tier_requirement"),
    isPublic: boolean("is_public").notNull().default(false),

    shelbyCID: text("shelby_cid").notNull(),
    shelbyBlobUrl: text("shelby_blob_url").notNull(),
    shelbyChunksetId: text("shelby_chunkset_id"),
    sessionIdUsedForUpload: text("session_id_used_for_upload"),

    streamCount: integer("stream_count").notNull().default(0),
    viewCount: integer("view_count").notNull().default(0),

    uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    thumbnailUrl: text("thumbnail_url"),
  },
  (table) => ({
    creatorIdx: index("content_creator_idx").on(table.creatorId),
    creatorWalletIdx: index("content_creator_wallet_idx").on(table.creatorWallet),
    publicIdx: index("content_public_idx").on(table.isPublic),
    tierIdx: index("content_tier_idx").on(table.tierRequirement),
  })
);

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    read: boolean("read").notNull().default(false),
    link: text("link"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("notifications_user_idx").on(table.userId),
    readIdx: index("notifications_read_idx").on(table.read),
    userReadIdx: index("notifications_user_read_idx").on(table.userId, table.read),
  })
);

export const revenueEvents = pgTable(
  "revenue_events",
  {
    id: text("id").primaryKey(),
    creatorWallet: text("creator_wallet").notNull(),
    memberWallet: text("member_wallet").notNull(),
    amount: text("amount").notNull(),
    eventType: text("event_type").notNull(),
    tierId: integer("tier_id"),
    transactionHash: text("transaction_hash"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    creatorIdx: index("revenue_creator_idx").on(table.creatorWallet),
    memberIdx: index("revenue_member_idx").on(table.memberWallet),
    typeIdx: index("revenue_type_idx").on(table.eventType),
    txIdx: index("revenue_tx_idx").on(table.transactionHash),
  })
);

export const accessLogs = pgTable(
  "access_logs",
  {
    id: text("id").primaryKey(),
    userWallet: text("user_wallet").notNull(),
    contentId: text("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    accessType: text("access_type").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    accessedAt: timestamp("accessed_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("access_user_idx").on(table.userWallet),
    contentIdx: index("access_content_idx").on(table.contentId),
    typeIdx: index("access_type_idx").on(table.accessType),
  })
);

export const shelbySessions = pgTable(
  "shelby_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    chunksetsTotal: integer("chunksets_total").notNull(),
    chunksetsRemaining: integer("chunksets_remaining").notNull(),
    transactionHash: text("transaction_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("shelby_sessions_user_idx").on(table.userId),
    expiresIdx: index("shelby_sessions_expires_idx").on(table.expiresAt),
  })
);
