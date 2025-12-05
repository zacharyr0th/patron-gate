/**
 * @repo/blockchain - PatronGate Aptos Membership Contract SDK
 *
 * TypeScript SDK and React hooks for interacting with the deployed
 * membership smart contract on Aptos.
 *
 * Contract Address: 0xd6d6cd1e24213702d13504c50f4782aa1a83fc7c0c6c9417bac50a3d05d110bd
 * Network: Aptos Testnet
 */

// Export contract
export {
  MembershipContract,
  createMembershipContract,
  octasToAPT,
  aptToOctas,
  formatMembershipDuration,
} from "./membership-contract";

// Export types
export type { MembershipTier, Membership } from "./membership-contract";

// Export hooks
export { useMembership } from "./hooks";

// Contract constants - use env var or fallback to testnet deployment
export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_MEMBERSHIP_CONTRACT_ADDRESS ||
  "0xd6d6cd1e24213702d13504c50f4782aa1a83fc7c0c6c9417bac50a3d05d110bd";

export const TESTNET_NODE_URL = "https://fullnode.testnet.aptoslabs.com/v1";

export const MAINNET_NODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
