import { type NextRequest } from "next/server";
import { ContentService } from "@repo/database/services/content";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api-response";

/**
 * GET /api/content/[contentId]
 * Get content metadata by database ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;

    if (!contentId) {
      return errorResponse("Content ID required", 400);
    }

    const content = await ContentService.get(contentId);

    if (!content) {
      return notFoundResponse("Content not found");
    }

    return successResponse(content);
  } catch (error) {
    console.error("Failed to get content:", error);
    return errorResponse("Failed to get content", 500);
  }
}
