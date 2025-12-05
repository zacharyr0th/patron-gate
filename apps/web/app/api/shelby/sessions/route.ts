import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import { X402Facilitator } from "x402a/server";
import { ShelbySessionService } from "@repo/database";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api-response";

// Initialize facilitator with environment variables
const initializeFacilitator = () => {
  const privateKey = process.env.X402_FACILITATOR_PRIVATE_KEY;
  const contractAddress = process.env.X402_CONTRACT_ADDRESS;

  if (!privateKey || !contractAddress) {
    throw new Error("Missing X402_FACILITATOR_PRIVATE_KEY or X402_CONTRACT_ADDRESS in environment");
  }

  return new X402Facilitator({
    privateKey,
    contractAddress,
    network: "testnet", // SHELBYNET uses testnet chain ID
  });
};

// POST - Create new session after payment
export async function POST(request: NextRequest) {
  try {
    const { from, to, amount, authenticator, transactionPayload, nonce, validUntil, chainId } =
      await request.json();

    if (!from || !to || !amount || !authenticator || !transactionPayload) {
      return errorResponse(
        "Missing required fields: from, to, amount, authenticator, transactionPayload",
        400
      );
    }

    // Initialize facilitator and submit payment
    const facilitator = initializeFacilitator();
    const result = await facilitator.submitPayment({
      from,
      to,
      amount,
      nonce,
      authenticator,
      validUntil,
      chainId,
    });

    // Calculate chunksets based on payment amount
    const octasPerChunkset = Number(process.env.SHELBY_OCTAS_PER_CHUNKSET || "100000");
    const chunksets = Math.floor(Number(amount) / octasPerChunkset);

    // Create session in database
    const sessionId = `shelby_${randomUUID()}`;
    const session = await ShelbySessionService.create({
      id: sessionId,
      userId: from,
      chunksetsTotal: chunksets,
      chunksetsRemaining: chunksets,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      transactionHash: result.txHash,
    });

    const response = successResponse({
      session: {
        id: session.id,
        chunksetsTotal: session.chunksetsTotal,
        chunksetsRemaining: session.chunksetsRemaining,
        expiresAt: session.expiresAt,
      },
      transactionHash: result.txHash,
    });

    // Set session cookie
    response.cookies.set("shelby-session", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch {
    return errorResponse("Failed to create session", 500);
  }
}

// GET - Retrieve existing session
export async function GET(request: NextRequest) {
  try {
    const sessionId =
      request.headers.get("X-Shelby-Session") || request.cookies.get("shelby-session")?.value;

    if (!sessionId) {
      return errorResponse("No session ID provided", 400);
    }

    const session = await ShelbySessionService.getValid(sessionId);

    if (!session) {
      return notFoundResponse("Session not found or expired");
    }

    return successResponse({
      session: {
        id: session.id,
        chunksetsTotal: session.chunksetsTotal,
        chunksetsRemaining: session.chunksetsRemaining,
        expiresAt: session.expiresAt,
      },
    });
  } catch {
    return errorResponse("Failed to retrieve session", 500);
  }
}

// Helper function to consume chunksets (used by other endpoints)
export async function consumeChunksets(sessionId: string, count: number): Promise<boolean> {
  return ShelbySessionService.consumeChunksets(sessionId, count);
}

// Helper function to get session (used by other endpoints)
export async function getSessionById(sessionId: string) {
  return ShelbySessionService.getValid(sessionId);
}
