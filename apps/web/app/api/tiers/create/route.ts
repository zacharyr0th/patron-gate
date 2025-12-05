import { NextRequest } from "next/server";
import { TierService } from "@repo/database";
import { requireCreator } from "../../../../lib/auth";
import { syncTierFromBlockchain } from "../../../../lib/membership";
import { errorResponse, successResponse, unauthorizedResponse } from "../../../../lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const session = await requireCreator();
    if (!session) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { tierId, name, priceMonthly, priceYearly, benefits, maxMembers } = body;

    if (!tierId || !name || !priceMonthly || !priceYearly || !benefits || !maxMembers) {
      return errorResponse("Missing required fields");
    }

    // Create tier in database (assumes blockchain transaction already completed)
    const tier = await TierService.create({
      id: `${session.walletAddress}-tier-${tierId}`,
      creatorWallet: session.walletAddress,
      tierId,
      name,
      priceMonthly,
      priceYearly,
      benefits,
      maxMembers,
      currentMembers: 0,
      active: true,
    });

    // Sync from blockchain to ensure consistency
    await syncTierFromBlockchain(session.walletAddress, tierId);

    return successResponse(tier);
  } catch (error) {
    console.error("Create tier error:", error);
    return errorResponse("Failed to create tier");
  }
}
