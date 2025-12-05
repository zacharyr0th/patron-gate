/**
 * Shelby Upload Service
 * Based on official Shelby SDK documentation
 */

import { Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";

export interface UploadOptions {
  fileBuffer: Buffer;
  fileName: string;
  title?: string;
  description?: string;
  walletAddress: string;
  expirationDate?: Date;
}

export interface UploadResult {
  success: boolean;
  blobUrl: string;
  blobName: string;
  fileName: string;
  title: string;
  walletAddress: string;
  uploadedAt: string;
  transactionHash?: string;
  explorerUrl: string;
}

/**
 * Upload a file to Shelby Protocol
 */
export async function uploadToShelby(options: UploadOptions): Promise<UploadResult> {
  const { fileBuffer, fileName, title, walletAddress } = options;

  const uploadTitle = title || fileName;

  try {
    // Get master wallet private key
    const privateKeyStr = process.env.MASTER_APTOS_PRIVATE_KEY;
    if (!privateKeyStr) {
      throw new Error("MASTER_APTOS_PRIVATE_KEY not configured");
    }

    // Parse private key - remove 0x prefix if present
    const keyHex = privateKeyStr.startsWith("0x") ? privateKeyStr.slice(2) : privateKeyStr;
    const privateKey = new Ed25519PrivateKey(keyHex);
    const account = Account.fromPrivateKey({ privateKey });

    const accountAddress = account.accountAddress.toString();

    // Get API key
    const apiKey = process.env.SHELBY_API_KEY;
    if (!apiKey) {
      throw new Error("SHELBY_API_KEY not configured");
    }

    // Initialize Shelby client with SHELBYNET
    const shelbyClient = new ShelbyNodeClient({
      network: Network.SHELBYNET,
      apiKey,
    });

    // Calculate expiration (30 days from now in microseconds)
    const thirtyDaysMs = 1000 * 60 * 60 * 24 * 30;
    const expirationMicros = (Date.now() + thirtyDaysMs) * 1000;

    // Upload using the correct SDK method
    await shelbyClient.upload({
      signer: account,
      blobData: new Uint8Array(fileBuffer),
      blobName: fileName,
      expirationMicros,
    });

    // Generate blob URL
    const blobUrl = `https://api.shelbynet.shelby.xyz/shelby/v1/blobs/${accountAddress}/${encodeURIComponent(fileName)}`;

    // Generate explorer URL
    const explorerUrl = `https://explorer.shelby.xyz/shelbynet/account/${accountAddress}/blobs?name=${encodeURIComponent(fileName)}`;

    return {
      success: true,
      blobUrl,
      blobName: fileName,
      fileName,
      title: uploadTitle,
      walletAddress,
      uploadedAt: new Date().toISOString(),
      explorerUrl,
    };
  } catch (error) {
    throw error;
  }
}
