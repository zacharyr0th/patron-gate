import type { NextRequest } from "next/server";
import { ContentService, UserService } from "@repo/database";
import { uploadToShelby } from "@repo/storage";
import { successResponse, errorResponse } from "@/lib/api-response";
import { randomUUID } from "crypto";

// Allow large file uploads
export const maxDuration = 300; // 5 minutes
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const creatorWallet = formData.get("creatorWallet") as string;

    if (!file || !title || !creatorWallet) {
      return errorResponse("Missing required fields: file, title, creatorWallet", 400);
    }

    // Limit file size to 100MB
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return errorResponse("File too large. Maximum size is 100MB.", 400);
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFilename = `${timestamp}_${safeFilename}`;

    // 1. Upload file to Shelby Protocol
    console.log("Uploading to Shelby:", { filename: uniqueFilename, size: file.size });

    const shelbyResult = await uploadToShelby({
      fileBuffer,
      fileName: uniqueFilename,
      title,
      walletAddress: creatorWallet,
    });

    console.log("Shelby upload complete:", shelbyResult.blobUrl);

    // 2. Log metadata to DB for search/listing
    const user = await UserService.getOrCreate(creatorWallet, randomUUID());

    const contentType = file.type.startsWith("video")
      ? "video"
      : file.type.startsWith("audio")
        ? "audio"
        : file.type.startsWith("image")
          ? "image"
          : "file";

    const content = await ContentService.create({
      id: randomUUID(),
      creatorId: user.id,
      creatorWallet,
      title,
      description: description || null,
      contentType,
      fileSize: file.size,
      isPublic: true,
      shelbyBlobUrl: shelbyResult.blobUrl,
      shelbyCID: shelbyResult.blobName,
    });

    return successResponse({
      id: content.id,
      title: content.title,
      blobUrl: shelbyResult.blobUrl,
      explorerUrl: shelbyResult.explorerUrl,
    });
  } catch (error) {
    console.error("Upload failed:", error);
    return errorResponse(
      `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      500
    );
  }
}
