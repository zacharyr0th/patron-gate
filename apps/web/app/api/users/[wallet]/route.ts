import { NextRequest } from "next/server";
import { UserService } from "@repo/database";
import { getSession } from "../../../../lib/auth";
import {
  errorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "../../../../lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;
    const user = await UserService.getByWallet(wallet);

    if (!user) {
      return notFoundResponse("User not found");
    }

    return successResponse({
      id: user.id,
      walletAddress: user.walletAddress,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isCreator: user.isCreator,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return errorResponse("Failed to fetch user");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const { wallet } = await params;
    if (session.walletAddress.toLowerCase() !== wallet.toLowerCase()) {
      return unauthorizedResponse("Cannot update another user's profile");
    }

    const body = await request.json();
    const { username, bio, avatarUrl } = body;

    const user = await UserService.getByWallet(wallet.toLowerCase());
    if (!user) {
      return notFoundResponse("User not found");
    }

    const updated = await UserService.update(user.id, {
      username,
      bio,
      avatarUrl,
    });

    return successResponse(updated);
  } catch (error) {
    console.error("Update user error:", error);
    return errorResponse("Failed to update user");
  }
}
