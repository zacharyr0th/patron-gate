import { NextRequest } from "next/server";
import { CreatorService } from "@repo/database";
import { getSession } from "../../../../lib/auth";
import {
  errorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "../../../../lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const creator = await CreatorService.get(userId);

    if (!creator) {
      return notFoundResponse("Creator not found");
    }

    return successResponse(creator);
  } catch (error) {
    console.error("Get creator error:", error);
    return errorResponse("Failed to fetch creator");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const { userId } = await params;
    if (session.userId !== userId) {
      return unauthorizedResponse("Cannot update another creator's profile");
    }

    const body = await request.json();
    const { displayName, bannerUrl, socialLinks, category } = body;

    const updated = await CreatorService.update(userId, {
      displayName,
      bannerUrl,
      socialLinks,
      category,
    });

    return successResponse(updated);
  } catch (error) {
    console.error("Update creator error:", error);
    return errorResponse("Failed to update creator");
  }
}
