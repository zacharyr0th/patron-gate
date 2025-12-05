"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { Label } from "@repo/ui";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@repo/ui";

const POST_TYPES = [
  { value: "text", label: "Text Post" },
  { value: "announcement", label: "Announcement" },
  { value: "update", label: "Update" },
];

export default function PostCreatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    postType: "text",
    tierRequirement: "",
    isPublic: false,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!formData.title || !formData.body) {
        throw new Error("Title and body are required");
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          body: formData.body,
          postType: formData.postType,
          tierRequirement: formData.tierRequirement ? parseInt(formData.tierRequirement) : null,
          isPublic: formData.isPublic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create post");
      }

      // Redirect to posts management page
      router.push("/posts/manage");
    } catch (err: any) {
      console.error("Post creation error:", err);
      setError(err.message || "Failed to create post");
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create Post</CardTitle>
            <CardDescription>Share updates and content with your members</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Post Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter post title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postType">Post Type</Label>
                <select
                  id="postType"
                  value={formData.postType}
                  onChange={(e) => handleChange("postType", e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                  {POST_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Post Body *</Label>
                <textarea
                  id="body"
                  placeholder="Write your post content here..."
                  value={formData.body}
                  onChange={(e) => handleChange("body", e.target.value)}
                  className="w-full min-h-48 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  rows={12}
                  required
                />
                <p className="text-sm text-gray-500">Supports basic markdown formatting</p>
              </div>

              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold">Access Control</h3>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => handleChange("isPublic", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isPublic" className="font-normal cursor-pointer">
                    Make this post public (visible to everyone)
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
                      disabled={loadingTiers}
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
                  Text posts are great for updates, announcements, and written content. For media
                  (videos, audio, images), use the Content Upload feature instead.
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating Post..." : "Create Post"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
