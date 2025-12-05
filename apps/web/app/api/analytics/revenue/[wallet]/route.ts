import { NextRequest } from "next/server";
import { RevenueService } from "@repo/database";
import { requireAuth } from "../../../../../lib/auth";
import {
  errorResponse,
  successResponse,
  unauthorizedResponse,
} from "../../../../../lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session) {
      return unauthorizedResponse();
    }

    const { wallet } = await params;

    if (session.walletAddress.toLowerCase() !== wallet.toLowerCase()) {
      return unauthorizedResponse("Cannot access another creator's revenue");
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;
    const eventType = searchParams.get("eventType") as any;

    const events = await RevenueService.listByCreator(wallet.toLowerCase(), {
      eventType,
      startDate,
      endDate,
    });

    const totalRevenue = await RevenueService.getTotalRevenue(wallet.toLowerCase());

    return successResponse({
      events,
      totalRevenue,
    });
  } catch (error) {
    console.error("Get revenue analytics error:", error);
    return errorResponse("Failed to fetch revenue analytics");
  }
}
