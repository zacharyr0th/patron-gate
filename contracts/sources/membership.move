module patrongate::membership {
    use std::signer;
    use std::vector;
    use std::string::{Self, String};
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::account;
    use aptos_std::table::{Self, Table};

    // Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_TIER_NOT_FOUND: u64 = 3;
    const E_INSUFFICIENT_PAYMENT: u64 = 4;
    const E_MEMBERSHIP_EXPIRED: u64 = 5;
    const E_NOT_MEMBER: u64 = 6;
    const E_UNAUTHORIZED: u64 = 7;
    const E_TIER_FULL: u64 = 8;
    const E_OVERFLOW: u64 = 9;
    const E_INVALID_DURATION: u64 = 10;
    const E_INSUFFICIENT_BALANCE: u64 = 11;

    // Membership duration constants (in seconds)
    const MONTH_IN_SECONDS: u64 = 2592000; // 30 days
    const YEAR_IN_SECONDS: u64 = 31536000; // 365 days
    const MAX_DURATION_MONTHS: u64 = 1200; // Max 100 years

    /// Membership tier definition
    struct MembershipTier has store, drop {
        id: u64,
        name: String,
        price_monthly: u64,      // Price in APT (Octas)
        price_yearly: u64,       // Price in APT (Octas)
        benefits: vector<String>,
        max_members: u64,        // 0 for unlimited
        current_members: u64,
        active: bool,
    }

    /// Individual membership record
    /// start_time represents the original subscription date
    struct Membership has store, drop {
        tier_id: u64,
        start_time: u64,          // Original subscription date
        expiry_time: u64,
        auto_renew: bool,
        total_spent: u64,
    }

    /// Creator's membership registry
    struct MembershipRegistry has key {
        creator: address,
        tiers: vector<MembershipTier>,
        members: Table<address, Membership>,
        total_revenue: u64,
        total_withdrawn: u64,     // Track withdrawals
        withdrawal_address: address,
        signer_cap: account::SignerCapability,  // Resource account for holding funds
    }

    /// Events (V2 - direct emission)
    #[event]
    struct MembershipPurchasedEvent has drop, store {
        member: address,
        tier_id: u64,
        duration_months: u64,
        amount_paid: u64,
        expiry_time: u64,
    }

    #[event]
    struct MembershipRenewedEvent has drop, store {
        member: address,
        tier_id: u64,
        new_expiry_time: u64,
    }

    #[event]
    struct TierCreatedEvent has drop, store {
        tier_id: u64,
        name: String,
        price_monthly: u64,
    }

    #[event]
    struct RevenueWithdrawnEvent has drop, store {
        creator: address,
        amount: u64,
        withdrawal_address: address,
    }

    /// Initialize membership registry for a creator
    public entry fun initialize_registry(creator: &signer, withdrawal_address: address) {
        let creator_addr = signer::address_of(creator);
        assert!(!exists<MembershipRegistry>(creator_addr), E_ALREADY_INITIALIZED);

        // Create resource account to hold membership funds
        let (resource_signer, signer_cap) = account::create_resource_account(creator, b"patrongate_membership_vault");

        // Register resource account for AptosCoin
        coin::register<AptosCoin>(&resource_signer);

        move_to(creator, MembershipRegistry {
            creator: creator_addr,
            tiers: vector::empty(),
            members: table::new(),
            total_revenue: 0,
            total_withdrawn: 0,
            withdrawal_address,
            signer_cap,
        });
    }

    /// Create a new membership tier
    public entry fun create_tier(
        creator: &signer,
        name: String,
        price_monthly: u64,
        price_yearly: u64,
        benefits: vector<String>,
        max_members: u64,
    ) acquires MembershipRegistry {
        let creator_addr = signer::address_of(creator);
        assert!(exists<MembershipRegistry>(creator_addr), E_NOT_INITIALIZED);

        let registry = borrow_global_mut<MembershipRegistry>(creator_addr);
        let tier_id = vector::length(&registry.tiers);

        let tier = MembershipTier {
            id: tier_id,
            name,
            price_monthly,
            price_yearly,
            benefits,
            max_members,
            current_members: 0,
            active: true,
        };

        vector::push_back(&mut registry.tiers, tier);

        // Emit Event V2 (get tier from vector after push)
        let created_tier = vector::borrow(&registry.tiers, tier_id);
        event::emit(TierCreatedEvent {
            tier_id,
            name: created_tier.name,
            price_monthly,
        });
    }

    /// Purchase a membership
    public entry fun purchase_membership(
        member: &signer,
        creator_addr: address,
        tier_id: u64,
        duration_months: u64, // 1 for monthly, 12 for yearly
    ) acquires MembershipRegistry {
        assert!(exists<MembershipRegistry>(creator_addr), E_NOT_INITIALIZED);

        // Validate duration
        assert!(duration_months > 0, E_INVALID_DURATION);
        assert!(duration_months <= MAX_DURATION_MONTHS, E_OVERFLOW);

        let registry = borrow_global_mut<MembershipRegistry>(creator_addr);
        assert!(tier_id < vector::length(&registry.tiers), E_TIER_NOT_FOUND);

        let tier = vector::borrow_mut(&mut registry.tiers, tier_id);
        assert!(tier.active, E_TIER_NOT_FOUND);

        let member_addr = signer::address_of(member);

        // Check max_members limit for new members
        if (tier.max_members > 0 && !table::contains(&registry.members, member_addr)) {
            assert!(tier.current_members < tier.max_members, E_TIER_FULL);
        };

        // Calculate payment amount with overflow check
        let amount = if (duration_months == 12) {
            tier.price_yearly
        } else {
            // Overflow check: ensure multiplication doesn't overflow
            assert!(tier.price_monthly <= 18446744073709551615 / MAX_DURATION_MONTHS, E_OVERFLOW);
            let product = tier.price_monthly * duration_months;
            assert!(product >= tier.price_monthly, E_OVERFLOW);
            product
        };

        // Calculate expiry time with overflow check
        let current_time = timestamp::now_seconds();
        let duration_seconds = duration_months * MONTH_IN_SECONDS;
        assert!(duration_seconds >= duration_months, E_OVERFLOW);
        assert!(current_time <= 18446744073709551615 - duration_seconds, E_OVERFLOW);
        let expiry_time = current_time + duration_seconds;

        // Get resource account address for fund storage
        let resource_addr = account::get_signer_capability_address(&registry.signer_cap);

        // Transfer payment from member to resource account
        coin::transfer<AptosCoin>(member, resource_addr, amount);

        // Create or update membership
        let is_existing_member = table::contains(&registry.members, member_addr);
        let old_tier_id = if (is_existing_member) {
            table::borrow(&registry.members, member_addr).tier_id
        } else {
            tier_id // Same tier, no switch
        };

        if (is_existing_member) {
            // Update membership
            let membership = table::borrow_mut(&mut registry.members, member_addr);

            // Overflow check for total_spent
            assert!(membership.total_spent <= 18446744073709551615 - amount, E_OVERFLOW);
            membership.total_spent = membership.total_spent + amount;
            membership.tier_id = tier_id;
            membership.expiry_time = expiry_time;
        } else {
            // New member
            table::add(&mut registry.members, member_addr, Membership {
                tier_id,
                start_time: current_time,
                expiry_time,
                auto_renew: false,
                total_spent: amount,
            });
        };

        // Update tier counts after membership operations
        if (old_tier_id != tier_id) {
            // Switching tiers - decrement old, increment new
            let old_tier = vector::borrow_mut(&mut registry.tiers, old_tier_id);
            old_tier.current_members = old_tier.current_members - 1;

            let new_tier = vector::borrow_mut(&mut registry.tiers, tier_id);
            new_tier.current_members = new_tier.current_members + 1;
        } else if (!is_existing_member) {
            // New member to this tier
            tier.current_members = tier.current_members + 1;
        };

        // Update total revenue with overflow check
        assert!(registry.total_revenue <= 18446744073709551615 - amount, E_OVERFLOW);
        registry.total_revenue = registry.total_revenue + amount;

        // Emit Event V2
        event::emit(MembershipPurchasedEvent {
            member: member_addr,
            tier_id,
            duration_months,
            amount_paid: amount,
            expiry_time,
        });
    }

    /// Check if an address has an active membership
    #[view]
    public fun is_member(creator_addr: address, member_addr: address): bool acquires MembershipRegistry {
        if (!exists<MembershipRegistry>(creator_addr)) {
            return false
        };

        let registry = borrow_global<MembershipRegistry>(creator_addr);

        if (!table::contains(&registry.members, member_addr)) {
            return false
        };

        let membership = table::borrow(&registry.members, member_addr);
        let current_time = timestamp::now_seconds();

        membership.expiry_time > current_time
    }

    /// Get membership details
    #[view]
    public fun get_membership(
        creator_addr: address,
        member_addr: address
    ): (u64, u64, u64, bool) acquires MembershipRegistry {
        assert!(exists<MembershipRegistry>(creator_addr), E_NOT_INITIALIZED);
        let registry = borrow_global<MembershipRegistry>(creator_addr);

        assert!(table::contains(&registry.members, member_addr), E_NOT_MEMBER);
        let membership = table::borrow(&registry.members, member_addr);

        (
            membership.tier_id,
            membership.start_time,
            membership.expiry_time,
            membership.auto_renew
        )
    }

    /// Get tier details
    #[view]
    public fun get_tier(
        creator_addr: address,
        tier_id: u64
    ): (String, u64, u64, u64, u64, bool) acquires MembershipRegistry {
        assert!(exists<MembershipRegistry>(creator_addr), E_NOT_INITIALIZED);
        let registry = borrow_global<MembershipRegistry>(creator_addr);
        assert!(tier_id < vector::length(&registry.tiers), E_TIER_NOT_FOUND);

        let tier = vector::borrow(&registry.tiers, tier_id);
        (
            tier.name,
            tier.price_monthly,
            tier.price_yearly,
            tier.max_members,
            tier.current_members,
            tier.active
        )
    }

    /// Get total number of tiers
    #[view]
    public fun get_total_tiers(creator_addr: address): u64 acquires MembershipRegistry {
        if (!exists<MembershipRegistry>(creator_addr)) {
            return 0
        };
        let registry = borrow_global<MembershipRegistry>(creator_addr);
        vector::length(&registry.tiers)
    }

    /// Get available balance for withdrawal
    #[view]
    public fun get_available_balance(creator_addr: address): u64 acquires MembershipRegistry {
        assert!(exists<MembershipRegistry>(creator_addr), E_NOT_INITIALIZED);
        let registry = borrow_global<MembershipRegistry>(creator_addr);
        registry.total_revenue - registry.total_withdrawn
    }

    /// Withdraw accumulated revenue
    public entry fun withdraw_revenue(
        creator: &signer,
        amount: u64
    ) acquires MembershipRegistry {
        let creator_addr = signer::address_of(creator);
        assert!(exists<MembershipRegistry>(creator_addr), E_NOT_INITIALIZED);

        let registry = borrow_global_mut<MembershipRegistry>(creator_addr);
        assert!(creator_addr == registry.creator, E_UNAUTHORIZED);

        // Check available balance
        let available = registry.total_revenue - registry.total_withdrawn;
        assert!(amount <= available, E_INSUFFICIENT_BALANCE);

        // Use resource account to transfer funds
        let resource_signer = account::create_signer_with_capability(&registry.signer_cap);
        coin::transfer<AptosCoin>(&resource_signer, registry.withdrawal_address, amount);

        // Update withdrawn amount with overflow check
        assert!(registry.total_withdrawn <= 18446744073709551615 - amount, E_OVERFLOW);
        registry.total_withdrawn = registry.total_withdrawn + amount;

        // Emit Event V2
        event::emit(RevenueWithdrawnEvent {
            creator: creator_addr,
            amount,
            withdrawal_address: registry.withdrawal_address,
        });
    }

    /// Cancel membership (member initiated - disables auto-renew)
    public entry fun cancel_membership(
        member: &signer,
        creator_addr: address
    ) acquires MembershipRegistry {
        let member_addr = signer::address_of(member);
        assert!(exists<MembershipRegistry>(creator_addr), E_NOT_INITIALIZED);

        let registry = borrow_global_mut<MembershipRegistry>(creator_addr);
        assert!(table::contains(&registry.members, member_addr), E_NOT_MEMBER);

        let membership = table::borrow_mut(&mut registry.members, member_addr);
        membership.auto_renew = false;
    }

    /// Cleanup expired membership (reduces storage, updates counts)
    public entry fun cleanup_expired_membership(
        creator_addr: address,
        member_addr: address
    ) acquires MembershipRegistry {
        assert!(exists<MembershipRegistry>(creator_addr), E_NOT_INITIALIZED);

        let registry = borrow_global_mut<MembershipRegistry>(creator_addr);
        assert!(table::contains(&registry.members, member_addr), E_NOT_MEMBER);

        let membership = table::borrow(&registry.members, member_addr);
        let current_time = timestamp::now_seconds();

        // Only cleanup if actually expired
        assert!(membership.expiry_time <= current_time, E_MEMBERSHIP_EXPIRED);

        // Get tier_id before removing
        let tier_id = membership.tier_id;

        // Remove expired membership
        table::remove(&mut registry.members, member_addr);

        // Decrement tier member count
        let tier = vector::borrow_mut(&mut registry.tiers, tier_id);
        tier.current_members = tier.current_members - 1;
    }

    /// Update tier status (activate/deactivate)
    public entry fun update_tier_status(
        creator: &signer,
        tier_id: u64,
        active: bool
    ) acquires MembershipRegistry {
        let creator_addr = signer::address_of(creator);
        assert!(exists<MembershipRegistry>(creator_addr), E_NOT_INITIALIZED);

        let registry = borrow_global_mut<MembershipRegistry>(creator_addr);
        assert!(tier_id < vector::length(&registry.tiers), E_TIER_NOT_FOUND);
        assert!(creator_addr == registry.creator, E_UNAUTHORIZED);

        let tier = vector::borrow_mut(&mut registry.tiers, tier_id);
        tier.active = active;
    }
}
