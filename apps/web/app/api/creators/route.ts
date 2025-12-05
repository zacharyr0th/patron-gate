import { NextRequest } from "next/server";
import { CreatorService } from "@repo/database";
import { errorResponse, successResponse } from "../../../lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = Number.parseInt(searchParams.get("limit") || "50");
    const offset = Number.parseInt(searchParams.get("offset") || "0");

    const creators = await CreatorService.list({
      category,
      search,
      limit,
      offset,
    });

    return successResponse(creators);
  } catch (error) {
    console.error("List creators error:", error);
    return errorResponse("Failed to fetch creators");
  }
}
