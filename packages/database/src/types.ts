import type {
  accessLogs,
  content,
  creatorProfiles,
  membershipsCache,
  membershipTiersCache,
  notifications,
  posts,
  revenueEvents,
  shelbySessions,
  users,
} from "./drizzle-schema";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type CreatorProfile = typeof creatorProfiles.$inferSelect;
export type NewCreatorProfile = typeof creatorProfiles.$inferInsert;

export type MembershipTierCache = typeof membershipTiersCache.$inferSelect;
export type NewMembershipTierCache = typeof membershipTiersCache.$inferInsert;

export type MembershipCache = typeof membershipsCache.$inferSelect;
export type NewMembershipCache = typeof membershipsCache.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type RevenueEvent = typeof revenueEvents.$inferSelect;
export type NewRevenueEvent = typeof revenueEvents.$inferInsert;

export type AccessLog = typeof accessLogs.$inferSelect;
export type NewAccessLog = typeof accessLogs.$inferInsert;

export type ShelbySession = typeof shelbySessions.$inferSelect;
export type NewShelbySession = typeof shelbySessions.$inferInsert;

export type NotificationType =
  | "membership_purchased"
  | "membership_renewed"
  | "membership_expiring"
  | "membership_expired"
  | "new_content"
  | "new_post"
  | "revenue_received"
  | "withdrawal_completed"
  | "tier_created"
  | "tier_updated";

export type PostType = "text" | "announcement" | "update";

export type RevenueEventType =
  | "membership_purchase"
  | "membership_renewal"
  | "withdrawal"
  | "refund"
  | "treasury_yield";

export type AccessType = "view" | "stream" | "download";
