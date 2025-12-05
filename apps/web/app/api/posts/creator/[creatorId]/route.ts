import { NextRequest } from "next/server";
import { PostService } from "@repo/database";
import { errorResponse, successResponse } from "../../../../../lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ creatorId: string }> }
) {
  try {
    const { creatorId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const isPublic = searchParams.get("public") === "true" ? true : undefined;
    const limit = Number.parseInt(searchParams.get("limit") || "50");
    const offset = Number.parseInt(searchParams.get("offset") || "0");

    const posts = await PostService.listByCreator(creatorId, {
      isPublic,
      limit,
      offset,
    });

    return successResponse(posts);
  } catch (error) {
    console.error("List posts error:", error);
    return errorResponse("Failed to fetch posts");
  }
}
