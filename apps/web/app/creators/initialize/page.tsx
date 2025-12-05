"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { Label } from "@repo/ui";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@repo/ui";

const CATEGORIES = [
  "Art",
  "Music",
  "Video",
  "Writing",
  "Gaming",
  "Podcasts",
  "Education",
  "Technology",
  "Fitness",
  "Other",
];

export default function CreatorInitializePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    displayName: "",
    category: "",
    bio: "",
    bannerUrl: "",
    avatarUrl: "",
    twitter: "",
    instagram: "",
    youtube: "",
    website: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!formData.displayName || !formData.category) {
        throw new Error("Display name and category are required");
      }

      // Get current user session
      const sessionResponse = await fetch("/api/auth/session");
      if (!sessionResponse.ok) {
        throw new Error("Please login first");
      }

      const sessionData = await sessionResponse.json();
      const walletAddress = sessionData.user.walletAddress;

      // Initialize creator profile
      const response = await fetch("/api/creators/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          displayName: formData.displayName,
          category: formData.category,
          bio: formData.bio || null,
          bannerUrl: formData.bannerUrl || null,
          avatarUrl: formData.avatarUrl || null,
          socialLinks: {
            twitter: formData.twitter || undefined,
            instagram: formData.instagram || undefined,
            youtube: formData.youtube || undefined,
            website: formData.website || undefined,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to initialize creator profile");
      }

      await response.json();

      // Initialize creator on blockchain
      if (window.aptos) {
        try {
          const payload = {
            type: "entry_function_payload",
            function: `${process.env.NEXT_PUBLIC_MEMBERSHIP_CONTRACT_ADDRESS}::membership::initialize_registry`,
            type_arguments: [],
            arguments: [walletAddress], // withdrawal address same as creator
          };

          const txResponse = await window.aptos.signAndSubmitTransaction(payload);
          console.log("Blockchain initialization tx:", txResponse.hash);
        } catch (blockchainError) {
          console.error("Blockchain initialization error:", blockchainError);
          // Continue anyway - profile is created in DB
        }
      }

      // Redirect to creator dashboard
      router.push("/dashboard/creator");
    } catch (err: any) {
      console.error("Creator initialization error:", err);
      setError(err.message || "Failed to initialize creator profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Become a Creator</CardTitle>
            <CardDescription>
              Set up your creator profile to start monetizing your content on PatronGate
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  placeholder="Your creator name"
                  value={formData.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  placeholder="Tell your audience about yourself..."
                  value={formData.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  className="w-full min-h-24 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <Input
                    id="avatarUrl"
                    type="url"
                    placeholder="https://..."
                    value={formData.avatarUrl}
                    onChange={(e) => handleChange("avatarUrl", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bannerUrl">Banner URL</Label>
                  <Input
                    id="bannerUrl"
                    type="url"
                    placeholder="https://..."
                    value={formData.bannerUrl}
                    onChange={(e) => handleChange("bannerUrl", e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Social Links</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      placeholder="@username"
                      value={formData.twitter}
                      onChange={(e) => handleChange("twitter", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      placeholder="@username"
                      value={formData.instagram}
                      onChange={(e) => handleChange("instagram", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input
                      id="youtube"
                      placeholder="Channel URL"
                      value={formData.youtube}
                      onChange={(e) => handleChange("youtube", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://..."
                      value={formData.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  After creating your profile, you'll be able to create membership tiers and start
                  uploading content for your supporters.
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
                {isSubmitting ? "Creating Profile..." : "Create Creator Profile"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
