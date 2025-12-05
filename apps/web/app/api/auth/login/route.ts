import { NextRequest } from "next/server";
import { UserService } from "@repo/database";
import { setSession } from "../../../../lib/auth";
import { errorResponse, successResponse } from "../../../../lib/api-response";
import { Ed25519PublicKey, Ed25519Signature } from "@aptos-labs/ts-sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, signature, message, publicKey, timestamp } = body;

    if (!walletAddress || !signature || !message) {
      return errorResponse("Missing required fields");
    }

    // Verify signature if public key is provided
    if (publicKey && signature) {
      try {
        // Check timestamp is recent (within 5 minutes)
        const now = Date.now();
        const messageTimestamp = parseInt(timestamp);
        const timeDiff = Math.abs(now - messageTimestamp);

        if (timeDiff > 5 * 60 * 1000) {
          return errorResponse("Message expired. Please try again.");
        }

        // Verify the signature matches the message and public key
        const pubKey = new Ed25519PublicKey(publicKey);
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = new Uint8Array(Buffer.from(signature, "hex"));
        const ed25519Signature = new Ed25519Signature(signatureBytes);

        const isValid = pubKey.verifySignature({
          message: messageBytes,
          signature: ed25519Signature,
        });

        if (!isValid) {
          return errorResponse("Invalid signature");
        }
      } catch {
        return errorResponse("Failed to verify signature");
      }
    }

    // Generate a unique user ID
    const userId = `user_${walletAddress.toLowerCase()}`;

    // Get or create user
    const user = await UserService.getOrCreate(walletAddress.toLowerCase(), userId);

    // Set session cookie
    await setSession(walletAddress.toLowerCase());

    return successResponse({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        isCreator: user.isCreator,
      },
    });
  } catch {
    return errorResponse("Failed to login");
  }
}
