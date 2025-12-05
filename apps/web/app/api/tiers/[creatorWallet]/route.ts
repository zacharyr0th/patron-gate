import { NextRequest } from "next/server";
import { TierService } from "@repo/database";
import { errorResponse, successResponse } from "../../../../lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ creatorWallet: string }> }
) {
  try {
    const { creatorWallet } = await params;
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get("active") === "true";

    const tiers = activeOnly
      ? await TierService.listActive(creatorWallet.toLowerCase())
      : await TierService.listByCreator(creatorWallet.toLowerCase());

    return successResponse(tiers);
  } catch (error) {
    console.error("List tiers error:", error);
    return errorResponse("Failed to fetch tiers");
  }
}
