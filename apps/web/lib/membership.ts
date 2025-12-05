import { MembershipService, TierService } from "@repo/database";
import { createMembershipContract } from "@repo/blockchain";

export interface MembershipAccess {
  hasAccess: boolean;
  tierId?: number;
  expiryTime?: Date;
  reason?: string;
}

export async function verifyMembershipAccess(
  memberWallet: string,
  creatorWallet: string,
  requiredTierId?: number
): Promise<MembershipAccess> {
  // Check if membership exists in cache
  const membership = await MembershipService.getByMemberAndCreator(memberWallet, creatorWallet);

  if (!membership) {
    return {
      hasAccess: false,
      reason: "No active membership found",
    };
  }

  // Check if membership is expired
  const now = new Date();
  if (membership.expiryTime <= now) {
    return {
      hasAccess: false,
      reason: "Membership expired",
    };
  }

  // If no tier requirement, any active membership grants access
  if (!requiredTierId) {
    return {
      hasAccess: true,
      tierId: membership.tierId,
      expiryTime: membership.expiryTime,
    };
  }

  // Check if membership tier meets requirement
  if (membership.tierId >= requiredTierId) {
    return {
      hasAccess: true,
      tierId: membership.tierId,
      expiryTime: membership.expiryTime,
    };
  }

  return {
    hasAccess: false,
    tierId: membership.tierId,
    reason: `Tier ${requiredTierId} or higher required`,
  };
}

export async function syncMembershipFromBlockchain(
  memberWallet: string,
  creatorWallet: string
): Promise<void> {
  const contract = createMembershipContract();

  try {
    const membership = await contract.getMembership(creatorWallet, memberWallet);

    if (!membership) {
      return;
    }

    await MembershipService.syncFromBlockchain(memberWallet, creatorWallet, {
      tierId: membership.tierId,
      startTime: new Date(membership.startTime * 1000),
      expiryTime: new Date(membership.expiryTime * 1000),
      autoRenew: membership.autoRenew,
    });
  } catch (error) {
    console.error("Failed to sync membership from blockchain:", error);
  }
}

export async function syncTierFromBlockchain(creatorWallet: string, tierId: number): Promise<void> {
  const contract = createMembershipContract();

  try {
    const tier = await contract.getTier(creatorWallet, tierId);

    if (!tier) {
      return;
    }

    await TierService.syncFromBlockchain(creatorWallet, tierId, {
      name: tier.name,
      priceMonthly: tier.priceMonthly,
      priceYearly: tier.priceYearly,
      benefits: tier.benefits,
      maxMembers: tier.maxMembers,
      currentMembers: tier.currentMembers,
      active: tier.active,
    });
  } catch (error) {
    console.error("Failed to sync tier from blockchain:", error);
  }
}
