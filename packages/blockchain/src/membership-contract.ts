import { type Account, Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

export interface MembershipTier {
  id: number;
  name: string;
  priceMonthly: string;
  priceYearly: string;
  benefits: string[];
  maxMembers: number;
  currentMembers: number;
  active: boolean;
}

export interface Membership {
  tierId: number;
  startTime: number;
  expiryTime: number;
  autoRenew: boolean;
}

export class MembershipContract {
  private moduleAddress: string;

  constructor(moduleAddress: string) {
    this.moduleAddress = moduleAddress;
  }

  async initializeRegistry(creator: Account, withdrawalAddress: string): Promise<string> {
    const transaction = await aptos.transaction.build.simple({
      sender: creator.accountAddress,
      data: {
        function: `${this.moduleAddress}::membership::initialize_registry`,
        functionArguments: [withdrawalAddress],
      },
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: creator,
      transaction,
    });

    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    return executedTransaction.hash;
  }

  async createTier(
    creator: Account,
    name: string,
    priceMonthly: number,
    priceYearly: number,
    benefits: string[],
    maxMembers: number
  ): Promise<string> {
    const transaction = await aptos.transaction.build.simple({
      sender: creator.accountAddress,
      data: {
        function: `${this.moduleAddress}::membership::create_tier`,
        functionArguments: [name, priceMonthly, priceYearly, benefits, maxMembers],
      },
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: creator,
      transaction,
    });

    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    return executedTransaction.hash;
  }

  async purchaseMembership(
    member: Account,
    creatorAddress: string,
    tierId: number,
    durationMonths: number
  ): Promise<string> {
    const transaction = await aptos.transaction.build.simple({
      sender: member.accountAddress,
      data: {
        function: `${this.moduleAddress}::membership::purchase_membership`,
        functionArguments: [creatorAddress, tierId, durationMonths],
      },
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: member,
      transaction,
    });

    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    return executedTransaction.hash;
  }

  async isMember(creatorAddress: string, memberAddress: string): Promise<boolean> {
    try {
      const result = await aptos.view<[boolean]>({
        payload: {
          function: `${this.moduleAddress}::membership::is_member`,
          functionArguments: [creatorAddress, memberAddress],
        },
      });

      return result[0];
    } catch (error) {
      console.error("Error checking membership:", error);
      return false;
    }
  }

  async getMembership(creatorAddress: string, memberAddress: string): Promise<Membership | null> {
    try {
      const result = await aptos.view<[number, number, number, boolean]>({
        payload: {
          function: `${this.moduleAddress}::membership::get_membership`,
          functionArguments: [creatorAddress, memberAddress],
        },
      });

      return {
        tierId: result[0],
        startTime: result[1],
        expiryTime: result[2],
        autoRenew: result[3],
      };
    } catch (error) {
      console.error("Error getting membership:", error);
      return null;
    }
  }

  async getTier(creatorAddress: string, tierId: number): Promise<MembershipTier | null> {
    try {
      const result = await aptos.view<[string, number, number, number, number, boolean]>({
        payload: {
          function: `${this.moduleAddress}::membership::get_tier`,
          functionArguments: [creatorAddress, tierId],
        },
      });

      return {
        id: tierId,
        name: result[0],
        priceMonthly: result[1].toString(),
        priceYearly: result[2].toString(),
        benefits: [],
        maxMembers: result[3],
        currentMembers: result[4],
        active: result[5],
      };
    } catch (error) {
      console.error("Error getting tier:", error);
      return null;
    }
  }

  async cancelMembership(member: Account, creatorAddress: string): Promise<string> {
    const transaction = await aptos.transaction.build.simple({
      sender: member.accountAddress,
      data: {
        function: `${this.moduleAddress}::membership::cancel_membership`,
        functionArguments: [creatorAddress],
      },
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: member,
      transaction,
    });

    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    return executedTransaction.hash;
  }

  async withdrawRevenue(creator: Account, amount: number): Promise<string> {
    const transaction = await aptos.transaction.build.simple({
      sender: creator.accountAddress,
      data: {
        function: `${this.moduleAddress}::membership::withdraw_revenue`,
        functionArguments: [amount],
      },
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: creator,
      transaction,
    });

    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    return executedTransaction.hash;
  }
}

export function createMembershipContract(moduleAddress?: string): MembershipContract {
  const address = moduleAddress || process.env.NEXT_PUBLIC_MEMBERSHIP_CONTRACT_ADDRESS || "0x1";
  return new MembershipContract(address);
}

// Utility functions
export const octasToAPT = (octas: string | number): number => {
  return Number(octas) / 100000000;
};

export const aptToOctas = (apt: number): number => {
  return Math.floor(apt * 100000000);
};

export const formatMembershipDuration = (_startTime: number, expiryTime: number): string => {
  const expiry = new Date(expiryTime * 1000);
  const now = new Date();

  if (now > expiry) {
    return "Expired";
  }

  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft > 365) {
    const years = Math.floor(daysLeft / 365);
    return `${years} year${years > 1 ? "s" : ""} remaining`;
  } else if (daysLeft > 30) {
    const months = Math.floor(daysLeft / 30);
    return `${months} month${months > 1 ? "s" : ""} remaining`;
  } else {
    return `${daysLeft} day${daysLeft > 1 ? "s" : ""} remaining`;
  }
};
