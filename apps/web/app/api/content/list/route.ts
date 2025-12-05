import { ContentService } from "@repo/database/services/content";
import type { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";

// GET - List all content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creator = searchParams.get("creator");
    const publicOnly = searchParams.get("public") === "true";

    // Get content by creator or all content
    let contentList;
    if (creator) {
      // Check if it's a wallet address (starts with 0x)
      if (creator.startsWith("0x")) {
        contentList = await ContentService.listByCreatorWallet(creator);
      } else {
        contentList = await ContentService.listByCreator(creator, {
          isPublic: publicOnly ? true : undefined,
        });
      }
    } else if (publicOnly) {
      contentList = await ContentService.listPublic();
    } else {
      // Return all content for browse page
      contentList = await ContentService.listAll();
    }

    return successResponse({
      content: contentList,
      total: contentList.length,
    });
  } catch (error) {
    console.error("Failed to list content:", error);
    return errorResponse("Failed to list content", 500);
  }
}
