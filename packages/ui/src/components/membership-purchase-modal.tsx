"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface MembershipPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: {
    id: string;
    tierId: number;
    name: string;
    priceMonthly: string;
    priceYearly: string;
    benefits: string[];
  };
  creatorWallet: string;
  creatorName: string;
}

export function MembershipPurchaseModal({
  isOpen,
  onClose,
  tier,
  creatorWallet,
  creatorName,
}: MembershipPurchaseModalProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const price = billingPeriod === "monthly" ? tier.priceMonthly : tier.priceYearly;
  const priceInAPT = (parseInt(price) / 100_000_000).toFixed(2);
  const months = billingPeriod === "monthly" ? 1 : 12;

  const handlePurchase = async () => {
    setIsPurchasing(true);
    setError(null);

    try {
      if (!window.aptos) {
        throw new Error("Wallet not connected. Please install Petra wallet.");
      }

      // Create blockchain transaction
      const payload = {
        type: "entry_function_payload",
        function: `${process.env.NEXT_PUBLIC_MEMBERSHIP_CONTRACT_ADDRESS}::membership::purchase_membership`,
        type_arguments: [],
        arguments: [creatorWallet, tier.tierId, months],
      };

      await window.aptos.signAndSubmitTransaction(payload);

      // Wait for transaction to be processed
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Sync membership to database
      const sessionResponse = await fetch("/api/auth/session");
      if (!sessionResponse.ok) {
        throw new Error("Not authenticated");
      }

      const sessionData = await sessionResponse.json();

      await fetch("/api/memberships/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberWallet: sessionData.user.walletAddress,
          creatorWallet: creatorWallet,
        }),
      });

      // Silently continue if sync fails - blockchain is source of truth

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to purchase membership";
      setError(message);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase Membership</DialogTitle>
          <DialogDescription>
            Join {creatorName}'s community with the {tier.name} tier
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-800 dark:text-green-400">
                Membership purchased successfully! Redirecting...
              </p>
            </div>
          )}

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2">{tier.name}</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {tier.benefits.map((benefit, index) => (
                <li key={index}>- {benefit}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Billing Period</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={billingPeriod === "monthly" ? "default" : "outline"}
                onClick={() => setBillingPeriod("monthly")}
                disabled={isPurchasing}
              >
                Monthly
              </Button>
              <Button
                variant={billingPeriod === "yearly" ? "default" : "outline"}
                onClick={() => setBillingPeriod("yearly")}
                disabled={isPurchasing}
              >
                Yearly (Save{" "}
                {(
                  (1 - parseInt(tier.priceYearly) / (parseInt(tier.priceMonthly) * 12)) *
                  100
                ).toFixed(0)}
                %)
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-bold">{priceInAPT} APT</span>
            </div>
            <p className="text-sm text-gray-500">
              {billingPeriod === "monthly" ? "Billed monthly" : "Billed annually"}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Payment is processed on the Aptos blockchain. You'll need to sign a transaction with
              your wallet.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPurchasing}>
            Cancel
          </Button>
          <Button onClick={handlePurchase} disabled={isPurchasing || success}>
            {isPurchasing ? "Processing..." : `Purchase for ${priceInAPT} APT`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
