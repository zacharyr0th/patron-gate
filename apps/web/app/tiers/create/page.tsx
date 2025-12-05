"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { Label } from "@repo/ui";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@repo/ui";

export default function TierCreatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    priceMonthly: "",
    priceYearly: "",
    maxMembers: "",
    benefits: [""],
  });

  const handleAddBenefit = () => {
    setFormData((prev) => ({
      ...prev,
      benefits: [...prev.benefits, ""],
    }));
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const handleBenefitChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.map((b, i) => (i === index ? value : b)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!formData.name || !formData.priceMonthly || !formData.maxMembers) {
        throw new Error("Name, monthly price, and max members are required");
      }

      // Get current user session
      const sessionResponse = await fetch("/api/auth/session");
      if (!sessionResponse.ok) {
        throw new Error("Please login first");
      }

      const sessionData = await sessionResponse.json();
      const walletAddress = sessionData.user.walletAddress;

      if (!sessionData.user.isCreator) {
        throw new Error("Only creators can create tiers");
      }

      // Convert prices to smallest unit (assuming 8 decimals like APT)
      const priceMonthlyOctas = Math.floor(parseFloat(formData.priceMonthly) * 100_000_000);
      const priceYearlyOctas = formData.priceYearly
        ? Math.floor(parseFloat(formData.priceYearly) * 100_000_000)
        : priceMonthlyOctas * 12;

      const maxMembers = parseInt(formData.maxMembers);
      // Filter benefits to remove empty entries
      formData.benefits.filter((b) => b.trim() !== "");

      // Create tier on blockchain
      if (!window.aptos) {
        throw new Error("Wallet not connected");
      }

      const payload = {
        type: "entry_function_payload",
        function: `${process.env.NEXT_PUBLIC_MEMBERSHIP_CONTRACT_ADDRESS}::membership::create_tier`,
        type_arguments: [],
        arguments: [
          formData.name,
          priceMonthlyOctas.toString(),
          priceYearlyOctas.toString(),
          maxMembers,
        ],
      };

      const txResponse = await window.aptos.signAndSubmitTransaction(payload);
      console.log("Tier creation tx:", txResponse.hash);

      // Wait a moment for blockchain to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Sync tier to database
      const syncResponse = await fetch("/api/tiers/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creatorWallet: walletAddress,
          // The blockchain will assign a tierId, we'll fetch all tiers
        }),
      });

      if (!syncResponse.ok) {
        console.error("Failed to sync tier to database");
      }

      // Redirect to creator dashboard
      router.push("/dashboard/creator");
    } catch (err: any) {
      console.error("Tier creation error:", err);
      setError(err.message || "Failed to create tier");
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
            <CardTitle className="text-2xl">Create Membership Tier</CardTitle>
            <CardDescription>
              Define a new membership tier with pricing and benefits for your supporters
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
                <Label htmlFor="name">Tier Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Bronze, Silver, Gold"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priceMonthly">Monthly Price (APT) *</Label>
                  <Input
                    id="priceMonthly"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="5.00"
                    value={formData.priceMonthly}
                    onChange={(e) => handleChange("priceMonthly", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceYearly">Yearly Price (APT)</Label>
                  <Input
                    id="priceYearly"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="50.00 (optional, defaults to 12x monthly)"
                    value={formData.priceYearly}
                    onChange={(e) => handleChange("priceYearly", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxMembers">Max Members *</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  min="1"
                  placeholder="100"
                  value={formData.maxMembers}
                  onChange={(e) => handleChange("maxMembers", e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500">
                  Maximum number of members allowed for this tier
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Benefits</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddBenefit}>
                    Add Benefit
                  </Button>
                </div>
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Benefit ${index + 1}`}
                      value={benefit}
                      onChange={(e) => handleBenefitChange(index, e.target.value)}
                    />
                    {formData.benefits.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveBenefit(index)}
                      >
                        X
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-400">
                  On-chain Creation
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  This tier will be created on the Aptos blockchain. You'll need to sign a
                  transaction with your wallet. Once created, tier pricing and limits cannot be
                  changed (but you can deactivate the tier).
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
                {isSubmitting ? "Creating Tier..." : "Create Tier on Blockchain"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
