import { NextRequest } from "next/server";
import { syncTierFromBlockchain } from "../../../../lib/membership";
import { errorResponse, successResponse } from "../../../../lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creatorWallet, tierId } = body;

    if (!creatorWallet || tierId === undefined) {
      return errorResponse("Missing required fields");
    }

    await syncTierFromBlockchain(creatorWallet.toLowerCase(), tierId);

    return successResponse({ message: "Tier synced successfully" });
  } catch (error) {
    console.error("Sync tier error:", error);
    return errorResponse("Failed to sync tier");
  }
}
