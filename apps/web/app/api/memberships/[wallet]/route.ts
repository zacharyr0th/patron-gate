import { NextRequest } from "next/server";
import { MembershipService } from "@repo/database";
import { errorResponse, successResponse } from "../../../../lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get("active") === "true";

    const memberships = activeOnly
      ? await MembershipService.listActiveByMember(wallet.toLowerCase())
      : await MembershipService.listByMember(wallet.toLowerCase());

    return successResponse(memberships);
  } catch (error) {
    console.error("List memberships error:", error);
    return errorResponse("Failed to fetch memberships");
  }
}
