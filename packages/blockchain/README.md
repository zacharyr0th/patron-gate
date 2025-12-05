# @repo/blockchain

TypeScript SDK and React hooks for interacting with PatronGate's Aptos membership smart contract.

## Installation

This package is part of the PatronGate monorepo. Install dependencies from the root:

```bash
cd /Users/zach/Documents/patrongate
bun install
```

## Contract Information

**Network**: Aptos Testnet
**Contract Address**: `0xd6d6cd1e24213702d13504c50f4782aa1a83fc7c0c6c9417bac50a3d05d110bd`
**Module**: `membership`

**Explorer**: https://explorer.aptoslabs.com/account/0xd6d6cd1e24213702d13504c50f4782aa1a83fc7c0c6c9417bac50a3d05d110bd?network=testnet

## Quick Start

### Basic Client Usage

```typescript
import { membershipClient, octasToAPT } from "@repo/blockchain/membership-client";

// Check if user is a member
const isMember = await membershipClient.isMember(
  "CREATOR_ADDRESS",
  "USER_ADDRESS"
);

// Get all tiers for a creator
const tiers = await membershipClient.getAllTiers("CREATOR_ADDRESS");

tiers.forEach((tier) => {
  console.log(`${tier.name}: ${octasToAPT(tier.priceMonthly)} APT/month`);
});

// Purchase membership
import { AptosAccount } from "aptos";

const account = new AptosAccount(); // Or load from private key
const txHash = await membershipClient.purchaseMembership(
  account,
  "CREATOR_ADDRESS",
  0, // Tier ID
  1  // Duration in months
);
```

### React Hooks

```typescript
import { useTiers, useIsMember, useMembershipActions } from "@repo/blockchain/hooks/useMembership";

function MembershipPage({ creatorAddress, userAddress }) {
  // Get all tiers
  const { tiers, loading, refresh } = useTiers(creatorAddress);

  // Check membership status
  const { isMember } = useIsMember(creatorAddress, userAddress);

  // Actions
  const { purchaseMembership } = useMembershipActions();

  const handlePurchase = async (tierId: number) => {
    const txHash = await purchaseMembership(
      account,
      creatorAddress,
      tierId,
      1 // 1 month
    );
    refresh(); // Refresh tier data
  };

  return (
    <div>
      {isMember && <p>You are a member!</p>}
      {tiers.map(tier => (
        <TierCard key={tier.id} tier={tier} onPurchase={handlePurchase} />
      ))}
    </div>
  );
}
```

### React Components

Pre-built components for common use cases:

```typescript
import { MembershipCard, CreatorDashboard } from "@repo/blockchain/components/MembershipCard";

// Display tiers for users to purchase
<MembershipCard
  creatorAddress="0x..."
  userAddress="0x..."
  account={aptosAccount}
/>

// Creator dashboard with revenue and tier management
<CreatorDashboard
  creatorAddress="0x..."
  account={aptosAccount}
/>
```

## API Reference

### MembershipClient

The main client for interacting with the contract.

#### Entry Functions (Require Transaction)

**`initializeRegistry(account, withdrawalAddress)`**
Initialize a creator's membership registry. Must be called once before creating tiers.

```typescript
const txHash = await membershipClient.initializeRegistry(
  account,
  withdrawalAddress
);
```

**`createTier(account, name, priceMonthly, priceYearly, benefits, maxMembers)`**
Create a new membership tier.

```typescript
const txHash = await membershipClient.createTier(
  account,
  "Gold Tier",
  5000000,    // 0.05 APT/month
  50000000,   // 0.5 APT/year
  ["Perk 1", "Perk 2"],
  100         // Max 100 members, 0 = unlimited
);
```

**`purchaseMembership(account, creatorAddress, tierId, durationMonths)`**
Purchase a membership.

```typescript
const txHash = await membershipClient.purchaseMembership(
  account,
  creatorAddress,
  0,    // Tier ID
  12    // 12 months (yearly)
);
```

**`withdrawRevenue(account, amount)`**
Withdraw revenue (creator only).

```typescript
const txHash = await membershipClient.withdrawRevenue(
  account,
  5000000  // Amount in Octas
);
```

**`updateTierStatus(account, tierId, active)`**
Activate or deactivate a tier.

```typescript
const txHash = await membershipClient.updateTierStatus(
  account,
  0,      // Tier ID
  false   // Deactivate
);
```

**`cancelMembership(account, creatorAddress)`**
Cancel membership (disables auto-renew).

```typescript
const txHash = await membershipClient.cancelMembership(
  account,
  creatorAddress
);
```

#### View Functions (No Gas)

**`isMember(creatorAddress, memberAddress)`**
Check if an address is an active member.

```typescript
const isMember: boolean = await membershipClient.isMember(
  creatorAddress,
  memberAddress
);
```

**`getMembership(creatorAddress, memberAddress)`**
Get membership details.

```typescript
const membership = await membershipClient.getMembership(
  creatorAddress,
  memberAddress
);
// Returns: { tierId, startTime, expiryTime, autoRenew }
```

**`getTier(creatorAddress, tierId)`**
Get tier details.

```typescript
const tier = await membershipClient.getTier(creatorAddress, 0);
// Returns: { id, name, priceMonthly, priceYearly, maxMembers, currentMembers, active }
```

**`getTotalTiers(creatorAddress)`**
Get total number of tiers.

```typescript
const count: number = await membershipClient.getTotalTiers(creatorAddress);
```

**`getAvailableBalance(creatorAddress)`**
Get available balance for withdrawal.

```typescript
const balance: string = await membershipClient.getAvailableBalance(
  creatorAddress
);
```

**`getAllTiers(creatorAddress)`**
Get all tiers for a creator (convenience function).

```typescript
const tiers = await membershipClient.getAllTiers(creatorAddress);
```

### React Hooks

**`useIsMember(creatorAddress, memberAddress)`**
```typescript
const { isMember, loading, error, refresh } = useIsMember(
  creatorAddress,
  memberAddress
);
```

**`useMembershipDetails(creatorAddress, memberAddress)`**
```typescript
const { membership, loading, error, refresh } = useMembershipDetails(
  creatorAddress,
  memberAddress
);
```

**`useTiers(creatorAddress)`**
```typescript
const { tiers, loading, error, refresh } = useTiers(creatorAddress);
```

**`useAvailableBalance(creatorAddress)`**
```typescript
const { balance, balanceAPT, loading, error, refresh } = useAvailableBalance(
  creatorAddress
);
```

**`useMembershipActions()`**
```typescript
const {
  purchaseMembership,
  cancelMembership,
  withdrawRevenue,
  createTier,
  updateTierStatus,
  loading,
  error
} = useMembershipActions();
```

### Utility Functions

**`octasToAPT(octas)`**
Convert Octas to APT (divide by 100,000,000).

```typescript
const apt = octasToAPT("5000000"); // 0.05 APT
```

**`aptToOctas(apt)`**
Convert APT to Octas (multiply by 100,000,000).

```typescript
const octas = aptToOctas(0.05); // 5000000
```

**`formatMembershipDuration(startTime, expiryTime)`**
Format membership duration in human-readable format.

```typescript
const duration = formatMembershipDuration("1763418684", "1766010684");
// "30 days remaining" or "Expired"
```

## Live Contract Example

The contract is deployed and active on testnet with 3 tiers:

```bash
# View tiers
aptos move view --profile testnet \
  --function-id 0xd6d6cd1e24213702d13504c50f4782aa1a83fc7c0c6c9417bac50a3d05d110bd::membership::get_tier \
  --args address:0xd6d6cd1e24213702d13504c50f4782aa1a83fc7c0c6c9417bac50a3d05d110bd u64:0
```

**Tier 0 - Bronze**: 0.005 APT/month (unlimited members)
**Tier 1 - Silver**: 0.01 APT/month (500 max members)
**Tier 2 - Gold**: 0.05 APT/month (100 max members)

## Environment Variables

Add to your `.env`:

```env
NEXT_PUBLIC_MEMBERSHIP_CONTRACT=0xd6d6cd1e24213702d13504c50f4782aa1a83fc7c0c6c9417bac50a3d05d110bd
NEXT_PUBLIC_APTOS_NETWORK=testnet
NEXT_PUBLIC_APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
```

## Development

```bash
# From monorepo root
cd packages/blockchain

# Build
bun run build

# Type check
bun run typecheck

# Lint
bun run lint
```

## Testing

The contract has been tested on testnet:

- Registry initialized ✅
- Tiers created (Bronze, Silver, Gold) ✅
- Membership purchased ✅
- Revenue tracked ✅
- Withdrawal successful ✅

All 20 smart contract tests passing (100%).

## Security

- All critical security issues resolved
- Comprehensive test coverage
- Audit documentation available in `/contracts/AUDIT_SUMMARY.md`
- Revenue stored in secure resource account
- Overflow protection on all arithmetic
- Withdrawal tracking prevents over-withdrawal

## Support

- **Contract Source**: `/contracts/sources/membership.move`
- **Deployment Details**: `/contracts/DEPLOYED.md`
- **Quick Start**: `/contracts/QUICK_START.md`
- **Explorer**: https://explorer.aptoslabs.com/

## License

MIT
