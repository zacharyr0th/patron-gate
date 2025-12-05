import { NextRequest } from "next/server";
import {
  ContentService,
  CreatorService,
  MembershipService,
  PostService,
  RevenueService,
  UserService,
} from "@repo/database";
import { requireAuth } from "../../../../../lib/auth";
import {
  errorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "../../../../../lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session) {
      return unauthorizedResponse();
    }

    const { userId } = await params;

    if (session.userId !== userId) {
      return unauthorizedResponse("Cannot access another creator's analytics");
    }

    const user = await UserService.get(userId);
    if (!user) {
      return notFoundResponse("User not found");
    }

    const creatorProfile = await CreatorService.get(userId);
    if (!creatorProfile) {
      return notFoundResponse("Creator profile not found");
    }

    // Get active memberships count
    const activeMemberships = await MembershipService.listActiveByCreator(user.walletAddress);
    const activeMembers = activeMemberships.length;

    // Get content stats
    const allContent = await ContentService.listByCreator(userId);
    const totalViews = allContent.reduce((sum, c) => sum + (c.viewCount || 0), 0);
    const totalStreams = allContent.reduce((sum, c) => sum + (c.streamCount || 0), 0);

    // Get posts count
    const allPosts = await PostService.listByCreator(userId);
    const totalPosts = allPosts.length;

    // Get revenue for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRevenue = await RevenueService.getRevenueByPeriod(
      user.walletAddress,
      thirtyDaysAgo,
      new Date()
    );

    return successResponse({
      totalRevenue: creatorProfile.totalRevenue,
      totalMembers: creatorProfile.totalMembers,
      activeMembers,
      totalContent: allContent.length,
      totalPosts,
      totalViews,
      totalStreams,
      last30DaysRevenue: recentRevenue,
    });
  } catch (error) {
    console.error("Get creator analytics error:", error);
    return errorResponse("Failed to fetch creator analytics");
  }
}
