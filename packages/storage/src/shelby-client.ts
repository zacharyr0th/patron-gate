/**
 * Shelby Storage Client
 * Handles file uploads and retrieval from Shelby Protocol using master wallet
 */

import { uploadToShelby } from "./upload/shelby-upload";

export interface ShelbyUploadResult {
  cid: string; // Content ID (blobUrl from Shelby)
  chunksetId: string; // Shelby blob name
  size: number;
  filename: string;
  uploadedAt: Date;
}

export interface ShelbyClientConfig {
  apiKey?: string;
  network: "SHELBYNET" | "TESTNET";
  endpoint?: string;
}

export class ShelbyClient {
  private apiKey?: string;
  private endpoint: string;

  constructor(config: ShelbyClientConfig) {
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || "https://api.shelbynet.shelby.xyz/shelby";
  }

  /**
   * Upload a file to Shelby storage using platform's master wallet
   */
  async uploadFile(params: {
    file: File | Buffer;
    sessionId: string;
    filename?: string;
  }): Promise<ShelbyUploadResult> {
    const { file, sessionId, filename } = params;

    // Convert File to Buffer if needed
    let fileBuffer: Buffer;
    let finalFilename: string;

    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      finalFilename = filename || file.name;
    } else {
      fileBuffer = file;
      finalFilename = filename || "file.bin";
    }

    // Upload using master wallet
    const result = await uploadToShelby({
      fileBuffer,
      fileName: finalFilename,
      title: finalFilename,
      walletAddress: sessionId, // Using session ID as reference
    });

    return {
      cid: result.blobUrl, // Full Shelby blob URL
      chunksetId: result.blobName,
      size: fileBuffer.length,
      filename: finalFilename,
      uploadedAt: new Date(result.uploadedAt),
    };
  }

  /**
   * Retrieve a file from Shelby storage
   * CID is the full blobUrl from Shelby (https://api.shelbynet.shelby.xyz/shelby/v1/blobs/...)
   */
  async retrieveFile(cid: string): Promise<Response> {
    const headers: Record<string, string> = {};

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    // If CID is already a full URL, use it directly
    const url = cid.startsWith("http") ? cid : `${this.endpoint}/retrieve/${cid}`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to retrieve file: ${response.statusText}`);
    }

    return response;
  }

  /**
   * Get metadata for uploaded content (HEAD request)
   */
  async getMetadata(cid: string): Promise<{
    cid: string;
    size: number;
    chunksetId: string;
    uploadedAt: Date;
  }> {
    const headers: Record<string, string> = {};

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    try {
      // If CID is already a full URL, use it directly
      const url = cid.startsWith("http") ? cid : `${this.endpoint}/metadata/${cid}`;

      const response = await fetch(url, {
        method: "HEAD",
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to get metadata: ${response.statusText}`);
      }

      // Parse from response headers
      const contentLength = response.headers.get("content-length");
      const uploadedAt = response.headers.get("x-uploaded-at");

      return {
        cid,
        size: contentLength ? Number.parseInt(contentLength) : 0,
        chunksetId: "",
        uploadedAt: uploadedAt ? new Date(uploadedAt) : new Date(),
      };
    } catch (error) {
      console.warn("Metadata retrieval failed:", error);
      throw error;
    }
  }
}

// Export singleton instance for server-side use
export const shelbyClient = new ShelbyClient({
  apiKey: process.env.SHELBY_API_KEY,
  network: (process.env.SHELBY_NETWORK as "SHELBYNET" | "TESTNET") || "SHELBYNET",
});

// Note: Can also use import { ShelbyClient } from 'x402s/server' for the official implementation
