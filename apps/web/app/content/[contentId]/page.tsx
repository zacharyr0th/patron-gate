"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@repo/ui";

export default function ContentViewPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = params.contentId as string;

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    loadContent();
    checkAccess();
  }, [contentId]);

  const loadContent = async () => {
    try {
      const response = await fetch(`/api/content/${contentId}`);
      if (!response.ok) {
        throw new Error("Content not found");
      }

      const data = await response.json();
      setContent(data.data);
    } catch (err: any) {
      console.error("Error loading content:", err);
      setError(err.message || "Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const checkAccess = async () => {
    try {
      const sessionResponse = await fetch("/api/auth/session");
      if (!sessionResponse.ok) {
        setHasAccess(false);
        setCheckingAccess(false);
        return;
      }

      const sessionData = await sessionResponse.json();
      const walletAddress = sessionData.user.walletAddress;

      // Check if user has access to this content
      const response = await fetch(`/api/content/${contentId}`);
      if (!response.ok) {
        setHasAccess(false);
        setCheckingAccess(false);
        return;
      }

      const data = await response.json();
      const contentData = data.data;

      // If content is public, everyone has access
      if (contentData.isPublic) {
        setHasAccess(true);
        setCheckingAccess(false);
        return;
      }

      // If user is the creator, they have access
      if (contentData.creatorWallet === walletAddress) {
        setHasAccess(true);
        setCheckingAccess(false);
        return;
      }

      // Check membership
      const membershipResponse = await fetch(`/api/memberships/${walletAddress}`);
      if (membershipResponse.ok) {
        const membershipData = await membershipResponse.json();
        const activeMemberships = membershipData.data?.filter((m: any) => {
          return (
            m.creatorWallet === contentData.creatorWallet && new Date(m.expiryTime) > new Date()
          );
        });

        if (activeMemberships && activeMemberships.length > 0) {
          // Check tier requirement
          if (!contentData.tierRequirement) {
            setHasAccess(true);
          } else {
            const hasRequiredTier = activeMemberships.some(
              (m: any) => m.tierId >= contentData.tierRequirement
            );
            setHasAccess(hasRequiredTier);
          }
        }
      }
    } catch (err) {
      console.error("Error checking access:", err);
      setHasAccess(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading content...</div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">{error || "Content not found"}</p>
              <Button onClick={() => router.back()}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{content.title}</CardTitle>
              <CardDescription>
                <Badge className="mr-2 capitalize">{content.contentType}</Badge>
                {content.tierRequirement && `Requires Tier ${content.tierRequirement}+`}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <div className="mb-4">
                <span className="text-4xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Membership Required</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This content is exclusive to members. Purchase a membership to access.
              </p>
              <Button onClick={() => router.push(`/creators/${content.creatorWallet}`)}>
                View Membership Options
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="capitalize">{content.contentType}</Badge>
              {content.isPublic && <Badge variant="outline">Public</Badge>}
              {!content.isPublic && <Badge>Members Only</Badge>}
            </div>
            <CardTitle className="text-2xl">{content.title}</CardTitle>
            <CardDescription>
              <span>by </span>
              <Link
                href={`/creators/${content.creatorWallet}`}
                className="text-primary hover:underline"
              >
                {content.creatorWallet.slice(0, 8)}...{content.creatorWallet.slice(-6)}
              </Link>
              <span className="mx-2">•</span>
              <span>Uploaded {formatDate(content.uploadedAt)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Content Player */}
            <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
              {content.contentType === "video" && (
                <div className="text-center text-white">
                  <p className="mb-4">Video Player (Shelby Protocol)</p>
                  <a
                    href={content.shelbyBlobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Download/Stream Video
                  </a>
                </div>
              )}
              {content.contentType === "audio" && (
                <div className="text-center text-white">
                  <p className="mb-4">Audio Player (Shelby Protocol)</p>
                  <a
                    href={content.shelbyBlobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Download/Stream Audio
                  </a>
                </div>
              )}
              {content.contentType === "image" && (
                <img
                  src={content.shelbyBlobUrl}
                  alt={content.title}
                  className="w-full h-full object-contain"
                />
              )}
              {content.contentType === "file" && (
                <div className="text-center text-white">
                  <p className="mb-4">File Download</p>
                  <Button asChild>
                    <a href={content.shelbyBlobUrl} download>
                      Download File
                    </a>
                  </Button>
                </div>
              )}
            </div>

            {/* Content Details */}
            {content.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-400">{content.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">File Size</p>
                <p className="font-semibold">{formatFileSize(content.fileSize)}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Views</p>
                <p className="font-semibold">{content.viewCount || 0}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Streams</p>
                <p className="font-semibold">{content.streamCount || 0}</p>
              </div>
              {content.duration && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Duration</p>
                  <p className="font-semibold">{Math.floor(content.duration / 60)} min</p>
                </div>
              )}
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm">
              <p className="text-gray-600 dark:text-gray-400">Content ID: {content.id}</p>
              <p className="text-gray-600 dark:text-gray-400">Shelby CID: {content.shelbyCID}</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
              <Button asChild>
                <a href={`/api/content/${content.id}/download`} target="_blank">
                  Download
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
