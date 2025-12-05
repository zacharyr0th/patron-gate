import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { PostService } from "@repo/database";
import { requireCreator } from "../../../lib/auth";
import { errorResponse, successResponse, unauthorizedResponse } from "../../../lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const session = await requireCreator();
    if (!session) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { title, bodyContent, postType, tierRequirement, isPublic } = body;

    if (!title || !bodyContent) {
      return errorResponse("Title and body are required");
    }

    const post = await PostService.create({
      id: `post_${randomUUID()}`,
      creatorId: session.userId,
      title,
      body: bodyContent,
      postType: postType || "text",
      tierRequirement,
      isPublic: isPublic || false,
    });

    return successResponse(post);
  } catch {
    return errorResponse("Failed to create post");
  }
}
