import { Ed25519PublicKey, Ed25519Signature } from "@aptos-labs/ts-sdk";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const { signature, message, publicKey } = await request.json();

    if (!signature || !message || !publicKey) {
      return errorResponse("Missing required fields", 400);
    }

    const messageBytes = new TextEncoder().encode(message);

    // Create public key and signature objects
    const pubKey = new Ed25519PublicKey(publicKey);
    const sig = new Ed25519Signature(signature);

    const valid = pubKey.verifySignature({
      message: messageBytes,
      signature: sig,
    });

    if (valid) {
      return successResponse({
        valid: true,
        address: publicKey,
      });
    }

    return successResponse({
      valid: false,
      error: "Invalid signature",
    });
  } catch (error) {
    console.error("Signature verification error:", error);
    return errorResponse(error instanceof Error ? error.message : "Verification failed", 500);
  }
}
