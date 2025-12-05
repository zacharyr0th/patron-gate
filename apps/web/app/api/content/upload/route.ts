import { shelbyClient } from "@repo/storage";
import type { NextRequest } from "next/server";
import { consumeChunksets, getSessionById } from "../../shelby/sessions/route";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    // Get session from header or cookie
    const sessionId =
      request.headers.get("X-Shelby-Session") || request.cookies.get("shelby-session")?.value;

    if (!sessionId) {
      return unauthorizedResponse("No session ID provided. Please create a session first.");
    }

    // Verify session exists and has chunksets
    const session = await getSessionById(sessionId);

    if (!session) {
      return unauthorizedResponse("Invalid or expired session");
    }

    // Check if session expired
    if (new Date() > session.expiresAt) {
      return unauthorizedResponse("Session expired");
    }

    if (session.chunksetsRemaining < 1) {
      return errorResponse("Insufficient chunksets remaining. Please create a new session.", 402);
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const filename = formData.get("filename") as string | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;

    if (!file) {
      return errorResponse("No file provided", 400);
    }

    // Calculate chunksets needed (rough estimate: 1 chunkset per 10 MB)
    const fileSizeMB = file.size / (1024 * 1024);
    const chunksetsNeeded = Math.max(1, Math.ceil(fileSizeMB / 10));

    if (session.chunksetsRemaining < chunksetsNeeded) {
      return errorResponse(
        `Insufficient chunksets. Need ${chunksetsNeeded}, have ${session.chunksetsRemaining}`,
        402
      );
    }

    // Upload to Shelby
    const uploadResult = await shelbyClient.uploadFile({
      file,
      sessionId,
      filename: filename || file.name,
    });

    // Consume chunksets from the session
    const consumed = await consumeChunksets(sessionId, chunksetsNeeded);
    if (!consumed) {
      return errorResponse("Failed to consume chunksets from session", 500);
    }

    // Return upload result
    return successResponse({
      upload: {
        cid: uploadResult.cid,
        chunksetId: uploadResult.chunksetId,
        filename: uploadResult.filename,
        size: uploadResult.size,
        uploadedAt: uploadResult.uploadedAt,
        description,
        title,
      },
      session: {
        chunksetsRemaining: session.chunksetsRemaining - chunksetsNeeded,
        chunksetsUsed: chunksetsNeeded,
      },
      retrieveUrl: `/api/content/${uploadResult.cid}`,
      viewUrl: `/content/${uploadResult.cid}`,
    });
  } catch (error) {
    console.error("Upload failed:", error);
    return errorResponse("Upload failed", 500);
  }
}

// GET method to list user's uploads (optional)
export async function GET(request: NextRequest) {
  const sessionId =
    request.headers.get("X-Shelby-Session") || request.cookies.get("shelby-session")?.value;

  if (!sessionId) {
    return unauthorizedResponse("No session ID provided");
  }

  // In a real implementation, this would query uploaded content for this session
  return successResponse({
    message: "List uploads endpoint",
    sessionId,
  });
}
