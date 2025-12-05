import { NextRequest } from "next/server";
import { CreatorService, UserService } from "@repo/database";
import { getSession } from "../../../../lib/auth";
import { errorResponse, successResponse, unauthorizedResponse } from "../../../../lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { displayName, category } = body;

    if (!displayName) {
      return errorResponse("Display name is required");
    }

    // Promote user to creator
    await UserService.promoteToCreator(session.userId);

    // Create creator profile
    const creator = await CreatorService.create({
      userId: session.userId,
      displayName,
      category,
      totalRevenue: "0",
      totalMembers: 0,
    });

    return successResponse(creator);
  } catch (error) {
    console.error("Initialize creator error:", error);
    return errorResponse("Failed to initialize creator");
  }
}
