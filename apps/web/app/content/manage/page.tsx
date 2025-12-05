"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@repo/ui";

export default function ContentManagePage() {
  const router = useRouter();
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const sessionResponse = await fetch("/api/auth/session");
      if (!sessionResponse.ok) {
        throw new Error("Please login first");
      }

      const sessionData = await sessionResponse.json();
      const walletAddress = sessionData.user.walletAddress;

      const contentResponse = await fetch(`/api/content/list?creatorWallet=${walletAddress}`);
      if (!contentResponse.ok) {
        throw new Error("Failed to load content");
      }

      const contentData = await contentResponse.json();
      setContent(contentData.content || []);
    } catch (err: any) {
      console.error("Error loading content:", err);
      setError(err.message || "Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading content...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manage Content</h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage all your uploaded content
            </p>
          </div>
          <Button onClick={() => router.push("/content/upload")}>Upload Content</Button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {content.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You haven't uploaded any content yet
              </p>
              <Button onClick={() => router.push("/content/upload")}>
                Upload Your First Content
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge className="capitalize">{item.contentType}</Badge>
                    <div className="flex gap-2">
                      {item.isPublic && <Badge variant="outline">Public</Badge>}
                      {!item.isPublic && <Badge>Members Only</Badge>}
                    </div>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                  <CardDescription>Uploaded {formatDate(item.uploadedAt)}</CardDescription>
                </CardHeader>
                <CardContent>
                  {item.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{formatFileSize(item.fileSize)}</span>
                    <span>{item.viewCount || 0} views</span>
                    <span>{item.streamCount || 0} streams</span>
                  </div>
                  {item.tierRequirement && (
                    <p className="text-xs text-gray-500 mt-2">
                      Requires Tier {item.tierRequirement}+
                    </p>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/content/${item.id}`)}
                    >
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
