"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import {
  type Membership,
  type MembershipTier,
  createMembershipContract,
} from "../membership-contract";

export function useMembership(creatorAddress: string) {
  const { account, signAndSubmitTransaction, connected } = useWallet();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contract = createMembershipContract();

  const checkMembership = useCallback(async () => {
    if (!connected || !account) return;

    try {
      setIsLoading(true);
      const memberAddress = account.address.toString();
      const isMember = await contract.isMember(creatorAddress, memberAddress);

      if (isMember) {
        const membershipData = await contract.getMembership(creatorAddress, memberAddress);
        setMembership(membershipData);
      } else {
        setMembership(null);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check membership");
      console.error("Error checking membership:", err);
    } finally {
      setIsLoading(false);
    }
  }, [connected, account, creatorAddress, contract]);

  const purchaseMembership = useCallback(
    async (tierId: number, durationMonths: number) => {
      if (!connected || !account || !signAndSubmitTransaction) {
        throw new Error("Wallet not connected");
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await signAndSubmitTransaction({
          sender: account.address,
          data: {
            function: `${process.env.NEXT_PUBLIC_MEMBERSHIP_CONTRACT_ADDRESS}::membership::purchase_membership`,
            typeArguments: [],
            functionArguments: [creatorAddress, tierId.toString(), durationMonths.toString()],
          },
        });

        await checkMembership();

        return response.hash;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to purchase membership";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [connected, account, signAndSubmitTransaction, creatorAddress, checkMembership]
  );

  const cancelMembership = useCallback(async () => {
    if (!connected || !account || !signAndSubmitTransaction) {
      throw new Error("Wallet not connected");
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${process.env.NEXT_PUBLIC_MEMBERSHIP_CONTRACT_ADDRESS}::membership::cancel_membership`,
          typeArguments: [],
          functionArguments: [creatorAddress],
        },
      });

      await checkMembership();

      return response.hash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to cancel membership";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [connected, account, signAndSubmitTransaction, creatorAddress, checkMembership]);

  const loadTiers = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedTiers: MembershipTier[] = [];

      for (let i = 0; i < 10; i++) {
        const tier = await contract.getTier(creatorAddress, i);
        if (tier?.active) {
          loadedTiers.push(tier);
        } else {
          break;
        }
      }

      setTiers(loadedTiers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tiers");
      console.error("Error loading tiers:", err);
    } finally {
      setIsLoading(false);
    }
  }, [creatorAddress, contract]);

  useEffect(() => {
    if (connected && account) {
      checkMembership();
    }
  }, [connected, account, checkMembership]);

  useEffect(() => {
    loadTiers();
  }, [loadTiers]);

  return {
    membership,
    tiers,
    isLoading,
    error,
    isMember: membership !== null && membership.expiryTime > Date.now() / 1000,
    purchaseMembership,
    cancelMembership,
    refreshMembership: checkMembership,
    refreshTiers: loadTiers,
  };
}
