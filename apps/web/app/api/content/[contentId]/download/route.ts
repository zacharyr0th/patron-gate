import { ContentService, MembershipService } from "@repo/database";
import { shelbyClient } from "@repo/storage";
import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/api-response";

// GET - Download content (with access control)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;

    // Get content metadata
    const contentItem = await ContentService.get(contentId);

    if (!contentItem) {
      return notFoundResponse("Content not found");
    }

    // Check access control
    if (!contentItem.isPublic) {
      // Content requires membership - check auth
      const session = await getSession();

      if (!session) {
        return unauthorizedResponse("Authentication required to access this content");
      }

      // Check if user is the creator (always has access)
      const isCreator =
        session.walletAddress.toLowerCase() === contentItem.creatorWallet.toLowerCase();

      if (!isCreator) {
        // Check membership
        const hasAccess = await MembershipService.isActive(
          session.walletAddress.toLowerCase(),
          contentItem.creatorWallet.toLowerCase()
        );

        if (!hasAccess) {
          return forbiddenResponse("Membership required to access this content");
        }

        // If content has tier requirement, check tier level
        if (contentItem.tierRequirement !== null) {
          const membership = await MembershipService.getByMemberAndCreator(
            session.walletAddress.toLowerCase(),
            contentItem.creatorWallet.toLowerCase()
          );

          if (!membership || membership.tierId < contentItem.tierRequirement) {
            return forbiddenResponse("Higher tier membership required for this content");
          }
        }
      }
    }

    // Increment stream count
    await ContentService.incrementStreamCount(contentId);

    // Fetch content from Shelby
    const shelbyUrl = contentItem.shelbyBlobUrl || contentItem.shelbyCID;

    if (!shelbyUrl) {
      return errorResponse("Content storage URL not found", 500);
    }

    const shelbyResponse = await shelbyClient.retrieveFile(shelbyUrl);

    if (!shelbyResponse.ok) {
      console.error("Shelby fetch failed:", shelbyResponse.status, shelbyResponse.statusText);
      return errorResponse("Failed to retrieve content from storage", 502);
    }

    // Get content type from stored metadata or response
    const contentType =
      getContentType(contentItem.contentType) ||
      shelbyResponse.headers.get("content-type") ||
      "application/octet-stream";

    // Stream the response
    return new NextResponse(shelbyResponse.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(contentItem.title)}"`,
        "Content-Length": contentItem.fileSize?.toString() || "",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Download failed:", error);
    return errorResponse("Download failed", 500);
  }
}

function getContentType(contentType: string): string {
  const types: Record<string, string> = {
    video: "video/mp4",
    audio: "audio/mpeg",
    image: "image/jpeg",
    pdf: "application/pdf",
    file: "application/octet-stream",
  };
  return types[contentType.toLowerCase()] || "application/octet-stream";
}
