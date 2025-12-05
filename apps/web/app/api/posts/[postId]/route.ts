import { NextRequest } from "next/server";
import { PostService } from "@repo/database";
import { getSession } from "../../../../lib/auth";
import {
  errorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "../../../../lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const post = await PostService.get(postId);

    if (!post) {
      return notFoundResponse("Post not found");
    }

    return successResponse(post);
  } catch (error) {
    console.error("Get post error:", error);
    return errorResponse("Failed to fetch post");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const { postId } = await params;
    const post = await PostService.get(postId);

    if (!post) {
      return notFoundResponse("Post not found");
    }

    if (post.creatorId !== session.userId) {
      return unauthorizedResponse("Cannot update another creator's post");
    }

    const body = await request.json();
    const { title, bodyContent, tierRequirement, isPublic } = body;

    const updated = await PostService.update(postId, {
      title,
      body: bodyContent,
      tierRequirement,
      isPublic,
    });

    return successResponse(updated);
  } catch (error) {
    console.error("Update post error:", error);
    return errorResponse("Failed to update post");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const { postId } = await params;
    const post = await PostService.get(postId);

    if (!post) {
      return notFoundResponse("Post not found");
    }

    if (post.creatorId !== session.userId) {
      return unauthorizedResponse("Cannot delete another creator's post");
    }

    await PostService.delete(postId);

    return successResponse({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    return errorResponse("Failed to delete post");
  }
}
