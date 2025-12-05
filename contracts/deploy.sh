#!/bin/bash

# PatronGate Membership Contract Deployment Script
# This script deploys the membership contract to Aptos testnet

set -e

echo "========================================="
echo "PatronGate Membership Contract Deployment"
echo "========================================="
echo ""

# Configuration
PROFILE="testnet"
ADDRESS="0xd6d6cd1e24213702d13504c50f4782aa1a83fc7c0c6c9417bac50a3d05d110bd"

# Check if account is funded
echo "1. Checking account balance..."
BALANCE=$(aptos account list --profile $PROFILE 2>&1 | grep -o "coin: [0-9]*" | head -1 | awk '{print $2}' || echo "0")

if [ "$BALANCE" = "0" ] || [ -z "$BALANCE" ]; then
    echo ""
    echo "⚠️  Account not funded!"
    echo ""
    echo "Please fund your account at:"
    echo "https://aptos.dev/network/faucet?address=$ADDRESS"
    echo ""
    echo "Or try the faucet command:"
    echo "aptos account fund-with-faucet --profile testnet --faucet-url https://faucet.testnet.aptoslabs.com --amount 100000000"
    echo ""
    exit 1
fi

echo "✓ Account funded with $BALANCE Octas"
echo ""

# Compile contract
echo "2. Compiling contract..."
aptos move compile --save-metadata

if [ $? -ne 0 ]; then
    echo "✗ Compilation failed"
    exit 1
fi

echo "✓ Compilation successful"
echo ""

# Run tests
echo "3. Running tests..."
aptos move test --dev

if [ $? -ne 0 ]; then
    echo "✗ Tests failed"
    exit 1
fi

echo "✓ All 20 tests passing"
echo ""

# Deploy
echo "4. Deploying to testnet..."
echo ""
echo "This will:"
echo "  - Deploy membership.move to testnet"
echo "  - Deploy at address: $ADDRESS"
echo "  - Cost: ~100,000 - 500,000 Octas"
echo ""
read -p "Continue with deployment? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "Deploying..."
aptos move publish --profile $PROFILE --assume-yes

if [ $? -ne 0 ]; then
    echo "✗ Deployment failed"
    exit 1
fi

echo ""
echo "========================================="
echo "✓ Deployment Successful!"
echo "========================================="
echo ""
echo "Contract Address: $ADDRESS"
echo "Network: Testnet"
echo ""
echo "View on Explorer:"
echo "https://explorer.aptoslabs.com/account/$ADDRESS?network=testnet"
echo ""
echo "Next Steps:"
echo "1. Initialize a creator registry:"
echo "   aptos move run --profile testnet \\"
echo "     --function-id $ADDRESS::membership::initialize_registry \\"
echo "     --args address:YOUR_WITHDRAWAL_ADDRESS"
echo ""
echo "2. Create a membership tier:"
echo "   aptos move run --profile testnet \\"
echo "     --function-id $ADDRESS::membership::create_tier \\"
echo "     --args string:'Gold Tier' u64:1000000 u64:10000000 \\"
echo "            'vector<string>:[\"Perk 1\",\"Perk 2\"]' u64:100"
echo ""
echo "3. Update .env with contract address:"
echo "   NEXT_PUBLIC_MEMBERSHIP_CONTRACT=$ADDRESS"
echo ""
echo "========================================="
