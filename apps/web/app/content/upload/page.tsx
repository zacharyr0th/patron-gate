"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { Label } from "@repo/ui";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@repo/ui";

const CONTENT_TYPES = [
  { value: "video", label: "Video", accept: "video/*" },
  { value: "audio", label: "Audio", accept: "audio/*" },
  { value: "image", label: "Image", accept: "image/*" },
  { value: "file", label: "File (PDF, ZIP, etc.)", accept: "*/*" },
];

export default function ContentUploadPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    contentType: "video",
    tierRequirement: "",
    isPublic: false,
    thumbnailUrl: "",
  });

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    try {
      const sessionResponse = await fetch("/api/auth/session");
      if (!sessionResponse.ok) return;

      const sessionData = await sessionResponse.json();
      const walletAddress = sessionData.user.walletAddress;

      const tiersResponse = await fetch(`/api/tiers/${walletAddress}`);
      if (tiersResponse.ok) {
        const tiersData = await tiersResponse.json();
        setTiers(tiersData.tiers || []);
      }
    } catch (err) {
      console.error("Error loading tiers:", err);
    } finally {
      setLoadingTiers(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setUploadProgress(0);

    try {
      if (!formData.title || !selectedFile) {
        throw new Error("Title and file are required");
      }

      // Get session
      const sessionResponse = await fetch("/api/auth/session");
      if (!sessionResponse.ok) {
        throw new Error("Please login first");
      }

      const sessionData = await sessionResponse.json();
      const walletAddress = sessionData.user.walletAddress;

      // Create Shelby upload session
      setUploadProgress(10);
      const sessionReq = await fetch("/api/shelby/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: selectedFile.name,
        }),
      });

      if (!sessionReq.ok) {
        throw new Error("Failed to create upload session");
      }

      const sessionInfo = await sessionReq.json();
      setUploadProgress(20);

      // Upload file to Shelby Protocol
      const formDataUpload = new FormData();
      formDataUpload.append("file", selectedFile);

      const uploadResponse = await fetch(sessionInfo.uploadUrl, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to Shelby Protocol");
      }

      setUploadProgress(70);

      // Get content metadata (CID, etc.) from Shelby
      const shelbyMetadata = await uploadResponse.json();

      setUploadProgress(80);

      // Save content metadata to database
      const contentResponse = await fetch("/api/content/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          contentType: formData.contentType,
          fileSize: selectedFile.size,
          tierRequirement: formData.tierRequirement ? parseInt(formData.tierRequirement) : null,
          isPublic: formData.isPublic,
          shelbyCID: shelbyMetadata.cid || sessionInfo.sessionId,
          shelbyBlobUrl: shelbyMetadata.blobUrl || sessionInfo.uploadUrl,
          shelbyChunksetId: shelbyMetadata.chunksetId || null,
          sessionIdUsedForUpload: sessionInfo.sessionId,
          thumbnailUrl: formData.thumbnailUrl || null,
          creatorWallet: walletAddress,
        }),
      });

      if (!contentResponse.ok) {
        const errorData = await contentResponse.json();
        throw new Error(errorData.error || "Failed to save content metadata");
      }

      setUploadProgress(100);

      // Redirect to content management page
      router.push("/content/manage");
    } catch (err: any) {
      console.error("Content upload error:", err);
      setError(err.message || "Failed to upload content");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const currentAccept =
    CONTENT_TYPES.find((t) => t.value === formData.contentType)?.accept || "*/*";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Upload Content</CardTitle>
            <CardDescription>
              Upload videos, audio, images, or files for your members
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                </div>
              )}

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-blue-800 dark:text-blue-400">
                      Uploading...
                    </span>
                    <span className="text-sm text-blue-800 dark:text-blue-400">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="contentType">Content Type</Label>
                <select
                  id="contentType"
                  value={formData.contentType}
                  onChange={(e) => handleChange("contentType", e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  disabled={isSubmitting}
                >
                  {CONTENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Select File *</Label>
                <Input
                  id="file"
                  type="file"
                  accept={currentAccept}
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  required
                />
                {selectedFile && (
                  <p className="text-sm text-gray-500">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                    MB)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Content Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter content title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  placeholder="Describe your content..."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-full min-h-24 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>

              {formData.contentType === "video" && (
                <div className="space-y-2">
                  <Label htmlFor="thumbnailUrl">Thumbnail URL (optional)</Label>
                  <Input
                    id="thumbnailUrl"
                    type="url"
                    placeholder="https://..."
                    value={formData.thumbnailUrl}
                    onChange={(e) => handleChange("thumbnailUrl", e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold">Access Control</h3>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => handleChange("isPublic", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="isPublic" className="font-normal cursor-pointer">
                    Make this content public (visible to everyone)
                  </Label>
                </div>

                {!formData.isPublic && (
                  <div className="space-y-2">
                    <Label htmlFor="tierRequirement">Required Tier (optional)</Label>
                    <select
                      id="tierRequirement"
                      value={formData.tierRequirement}
                      onChange={(e) => handleChange("tierRequirement", e.target.value)}
                      className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                      disabled={loadingTiers || isSubmitting}
                    >
                      <option value="">All members</option>
                      {tiers.map((tier) => (
                        <option key={tier.id} value={tier.tierId}>
                          Tier {tier.tierId} - {tier.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500">
                      {loadingTiers
                        ? "Loading tiers..."
                        : "Leave empty to allow all members, or select a minimum tier"}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  Content is uploaded to Shelby Protocol, a decentralized storage network. Large
                  files may take a few minutes to upload.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedFile}>
                {isSubmitting ? "Uploading..." : "Upload Content"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
