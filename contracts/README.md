# PatronGate Membership Smart Contracts

Move smart contracts for blockchain-based creator memberships on Aptos.

## Overview

The membership contract enables creators to:
- Create multiple membership tiers with custom pricing
- Accept APT payments for monthly/yearly memberships
- Manage on-chain membership verification
- Withdraw accumulated revenue

## Contract Structure

```
contracts/
├── sources/
│   └── membership.move          # Main membership contract
├── scripts/
│   └── deploy.sh               # Deployment script
├── Move.toml                   # Move package configuration
└── README.md                   # This file
```

## Features

### For Creators

- **Initialize Registry**: Set up membership system for your content
- **Create Tiers**: Define unlimited membership tiers with:
  - Custom names and pricing
  - Monthly and yearly options
  - Benefit descriptions
  - Member limits (optional)
- **Withdraw Revenue**: Transfer accumulated earnings to your wallet

### For Members

- **Purchase Memberships**: Buy access with APT tokens
- **Flexible Duration**: Choose monthly or yearly subscriptions
- **On-Chain Verification**: Provably own membership NFT-style access
- **Cancel Anytime**: Stop auto-renewal

### View Functions

- **Check Membership**: Verify if address has active membership
- **Get Details**: View tier info, expiry dates, pricing
- **Public Data**: All membership data is transparent on-chain

## Contract Functions

### Entry Functions (Require Transaction)

#### `initialize_registry`
Initialize membership system for a creator.

```move
public entry fun initialize_registry(
    creator: &signer,
    withdrawal_address: address
)
```

**Example:**
```typescript
const tx = await signAndSubmitTransaction({
  type: "entry_function_payload",
  function: `${CONTRACT_ADDRESS}::membership::initialize_registry`,
  arguments: [creatorWalletAddress]
});
```

#### `create_tier`
Create a new membership tier.

```move
public entry fun create_tier(
    creator: &signer,
    name: String,
    price_monthly: u64,      // in Octas (1 APT = 100000000 Octas)
    price_yearly: u64,
    benefits: vector<String>,
    max_members: u64         // 0 for unlimited
)
```

**Example:**
```typescript
const tx = await signAndSubmitTransaction({
  type: "entry_function_payload",
  function: `${CONTRACT_ADDRESS}::membership::create_tier`,
  arguments: [
    "Gold Tier",
    "1000000000",  // 10 APT/month
    "10000000000", // 100 APT/year
    ["Exclusive content", "Early access"],
    "100"          // max 100 members
  ]
});
```

#### `purchase_membership`
Purchase a membership.

```move
public entry fun purchase_membership(
    member: &signer,
    creator_addr: address,
    tier_id: u64,
    duration_months: u64     // 1 for monthly, 12 for yearly
)
```

**Example:**
```typescript
const tx = await signAndSubmitTransaction({
  type: "entry_function_payload",
  function: `${CONTRACT_ADDRESS}::membership::purchase_membership`,
  arguments: [
    creatorAddress,
    0,   // tier_id
    12   // 12 months (yearly)
  ]
});
```

#### `cancel_membership`
Cancel auto-renewal.

```move
public entry fun cancel_membership(
    member: &signer,
    creator_addr: address
)
```

#### `withdraw_revenue`
Withdraw earnings (creator only).

```move
public entry fun withdraw_revenue(
    creator: &signer,
    amount: u64
)
```

### View Functions (No Transaction Required)

#### `is_member`
Check if address has active membership.

```move
#[view]
public fun is_member(
    creator_addr: address,
    member_addr: address
): bool
```

**Example:**
```typescript
const isMember = await aptos.view({
  function: `${CONTRACT_ADDRESS}::membership::is_member`,
  arguments: [creatorAddress, memberAddress]
});
```

#### `get_membership`
Get membership details.

```move
#[view]
public fun get_membership(
    creator_addr: address,
    member_addr: address
): (u64, u64, u64, bool)  // (tier_id, start_time, expiry_time, auto_renew)
```

#### `get_tier`
Get tier information.

```move
#[view]
public fun get_tier(
    creator_addr: address,
    tier_id: u64
): (String, u64, u64, u64, u64, bool)
// (name, price_monthly, price_yearly, max_members, current_members, active)
```

## Events

The contract emits the following events:

### `MembershipPurchasedEvent`
```move
struct MembershipPurchasedEvent has drop, store {
    member: address,
    tier_id: u64,
    duration_months: u64,
    amount_paid: u64,
    expiry_time: u64,
}
```

### `MembershipRenewedEvent`
```move
struct MembershipRenewedEvent has drop, store {
    member: address,
    tier_id: u64,
    new_expiry_time: u64,
}
```

### `TierCreatedEvent`
```move
struct TierCreatedEvent has drop, store {
    tier_id: u64,
    name: String,
    price_monthly: u64,
}
```

## Error Codes

```move
const E_NOT_INITIALIZED: u64 = 1;      // Registry not initialized
const E_ALREADY_INITIALIZED: u64 = 2;   // Registry already exists
const E_TIER_NOT_FOUND: u64 = 3;       // Invalid tier ID
const E_INSUFFICIENT_PAYMENT: u64 = 4;  // Not enough APT sent
const E_MEMBERSHIP_EXPIRED: u64 = 5;    // Membership has expired
const E_NOT_MEMBER: u64 = 6;           // Address is not a member
const E_UNAUTHORIZED: u64 = 7;         // Not authorized for action
```

## Deployment

### Prerequisites

1. Install Aptos CLI:
```bash
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
```

2. Create account:
```bash
aptos init --network testnet
```

3. Fund account:
```bash
aptos account fund-with-faucet --account default
```

### Deploy to Testnet

```bash
# From project root
bun contract:deploy

# Or manually
cd contracts
aptos move compile --named-addresses patrongate=default
aptos move publish --named-addresses patrongate=default
```

### Deploy to Mainnet

```bash
# From project root
bun contract:deploy:mainnet

# Or manually
cd contracts
aptos init --network mainnet
aptos move publish --named-addresses patrongate=default --network mainnet
```

## Testing

### Run Tests

```bash
# From project root
bun contract:test

# Or manually
cd contracts
aptos move test
```

### Manual Testing

1. Deploy contract to testnet
2. Initialize registry:
```bash
aptos move run \
  --function-id 'default::membership::initialize_registry' \
  --args address:YOUR_WALLET_ADDRESS
```

3. Create tier:
```bash
aptos move run \
  --function-id 'default::membership::create_tier' \
  --args string:"Gold" u64:1000000000 u64:10000000000 'vector<string>:["Benefit 1"]' u64:0
```

4. Check tier:
```bash
aptos move view \
  --function-id 'default::membership::get_tier' \
  --args address:YOUR_ADDRESS u64:0
```

## Gas Costs (Approximate)

Based on testnet testing:

- Initialize registry: ~0.001 APT
- Create tier: ~0.002 APT
- Purchase membership: ~0.003 APT
- Cancel membership: ~0.001 APT
- Withdraw revenue: ~0.002 APT

Note: Mainnet costs may vary based on network congestion.

## Security Considerations

1. **Payment Verification**: Contract verifies sufficient payment before creating membership
2. **Authorization**: Only creators can create tiers and withdraw funds
3. **Time-based Access**: Memberships automatically expire based on blockchain timestamp
4. **Immutable Records**: All transactions are permanently recorded on-chain

## Upgrading Contract

The contract uses named addresses for upgradeability:

1. Deploy new version with same address
2. Use `--upgrade` flag:
```bash
aptos move publish --upgrade --named-addresses patrongate=YOUR_ADDRESS
```

## Integration Examples

See TypeScript SDK in `packages/blockchain/src/membership-contract.ts`

Quick example:
```typescript
import { createMembershipContract } from "@repo/blockchain/membership";

const contract = createMembershipContract();

// Check membership
const isMember = await contract.isMember(creatorAddr, memberAddr);

// Get details
const tier = await contract.getTier(creatorAddr, 0);
console.log(tier.name, tier.priceMonthly);
```

## Resources

- [Move Language Book](https://move-language.github.io/move/)
- [Aptos Developer Docs](https://aptos.dev/)
- [Aptos TypeScript SDK](https://aptos.dev/sdks/ts-sdk/)
- [Move Tutorial](https://aptos.dev/tutorials/your-first-move-module/)

## License

MIT
