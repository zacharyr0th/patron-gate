#[test_only]
module patrongate::membership_tests {
    use std::signer;
    use std::string;
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use aptos_framework::account;
    use patrongate::membership;

    // Test helper: Setup test environment
    #[test_only]
    fun setup_test(
        aptos_framework: &signer,
        creator: &signer,
        member: &signer,
    ): (coin::BurnCapability<AptosCoin>, coin::MintCapability<AptosCoin>) {
        // Initialize timestamp
        timestamp::set_time_has_started_for_testing(aptos_framework);

        // Initialize AptosCoin for testing
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);

        // Register accounts for AptosCoin
        coin::register<AptosCoin>(creator);
        coin::register<AptosCoin>(member);

        // Mint test coins
        let creator_coins = coin::mint<AptosCoin>(1_000_000_000, &mint_cap);  // 10 APT
        let member_coins = coin::mint<AptosCoin>(10_000_000_000, &mint_cap);  // 100 APT

        coin::deposit(signer::address_of(creator), creator_coins);
        coin::deposit(signer::address_of(member), member_coins);

        // Return capabilities for tests that need to mint for additional users
        (burn_cap, mint_cap)
    }

    // Test 1: Basic initialization
    #[test(aptos_framework = @0x1, creator = @0x123)]
    fun test_initialize_registry(aptos_framework: &signer, creator: &signer) {
        let (burn_cap, mint_cap) = setup_test(aptos_framework, creator, creator);

        let withdrawal_addr = @0x456;
        membership::initialize_registry(creator, withdrawal_addr);

        // Verify registry exists (will abort if not)
        assert!(membership::get_total_tiers(signer::address_of(creator)) == 0, 0);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // Test 2: Cannot initialize twice
    #[test(aptos_framework = @0x1, creator = @0x123)]
    #[expected_failure(abort_code = membership::E_ALREADY_INITIALIZED)]
    fun test_double_initialization_fails(aptos_framework: &signer, creator: &signer) {
        let (burn_cap, mint_cap) = setup_test(aptos_framework, creator, creator);

        membership::initialize_registry(creator, @0x456);
        membership::initialize_registry(creator, @0x456);  // Should fail

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // Test 3: Create tier
    #[test(aptos_framework = @0x1, creator = @0x123)]
    fun test_create_tier(aptos_framework: &signer, creator: &signer) {
        let (burn_cap, mint_cap) = setup_test(aptos_framework, creator, creator);

        membership::initialize_registry(creator, @0x456);

        let name = string::utf8(b"Gold Tier");
        let benefits = vector[
            string::utf8(b"Early access"),
            string::utf8(b"Exclusive content"),
        ];

        membership::create_tier(
            creator,
            name,
            1_000_000,  // 0.01 APT monthly
            10_000_000, // 0.1 APT yearly
            benefits,
            100,        // max 100 members
        );

        // Verify tier created
        let creator_addr = signer::address_of(creator);
        let (tier_name, price_monthly, price_yearly, max_members, current_members, active) =
            membership::get_tier(creator_addr, 0);

        assert!(tier_name == string::utf8(b"Gold Tier"), 0);
        assert!(price_monthly == 1_000_000, 1);
        assert!(price_yearly == 10_000_000, 2);
        assert!(max_members == 100, 3);
        assert!(current_members == 0, 4);
        assert!(active == true, 5);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // Test 4: Purchase membership
    #[test(aptos_framework = @0x1, creator = @0x123, member = @0x789)]
    fun test_purchase_membership(
        aptos_framework: &signer,
        creator: &signer,
        member: &signer
    ) {
        let (burn_cap, mint_cap) = setup_test(aptos_framework, creator, member);

        let creator_addr = signer::address_of(creator);

        // Initialize and create tier
        membership::initialize_registry(creator, @0x456);
        membership::create_tier(
            creator,
            string::utf8(b"Basic"),
            1_000_000,  // 0.01 APT
            10_000_000, // 0.1 APT
            vector::empty(),
            0,  // unlimited
        );

        // Purchase membership
        membership::purchase_membership(member, creator_addr, 0, 1);

        // Verify membership
        assert!(membership::is_member(creator_addr, signer::address_of(member)), 0);

        let (tier_id, _start, _expiry, _auto_renew) =
            membership::get_membership(creator_addr, signer::address_of(member));
        assert!(tier_id == 0, 1);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // Test 5: Max members enforcement (AFTER FIX)
    #[test(aptos_framework = @0x1, creator = @0x123, member1 = @0x789, member2 = @0x7890)]
    #[expected_failure(abort_code = membership::E_TIER_FULL)]
    fun test_max_members_enforced(
        aptos_framework: &signer,
        creator: &signer,
        member1: &signer,
        member2: &signer,
    ) {
        let (burn_cap, mint_cap) = setup_test(aptos_framework, creator, member1);

        // Register member2 for coins and mint using existing mint_cap
        coin::register<AptosCoin>(member2);
        let coins = coin::mint<AptosCoin>(10_000_000_000, &mint_cap);
        coin::deposit(signer::address_of(member2), coins);

        let creator_addr = signer::address_of(creator);

        membership::initialize_registry(creator, @0x456);
        membership::create_tier(
            creator,
            string::utf8(b"Limited"),
            1_000_000,
            10_000_000,
            vector::empty(),
            1,  // Max 1 member
        );

        // First member should succeed
        membership::purchase_membership(member1, creator_addr, 0, 1);

        // Second member should fail
        membership::purchase_membership(member2, creator_addr, 0, 1);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // Test 6: Insufficient payment
    #[test(aptos_framework = @0x1, creator = @0x123, poor_member = @0x789)]
    #[expected_failure]
    fun test_insufficient_payment(
        aptos_framework: &signer,
        creator: &signer,
        poor_member: &signer,
    ) {
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);

        coin::register<AptosCoin>(creator);
        coin::register<AptosCoin>(poor_member);

        // Give poor_member very little APT
        let creator_coins = coin::mint<AptosCoin>(1_000_000_000, &mint_cap);
        let poor_coins = coin::mint<AptosCoin>(100, &mint_cap);  // Only 100 octas

        coin::deposit(signer::address_of(creator), creator_coins);
        coin::deposit(signer::address_of(poor_member), poor_coins);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);

        let creator_addr = signer::address_of(creator);

        membership::initialize_registry(creator, @0x456);
        membership::create_tier(
            creator,
            string::utf8(b"Expensive"),
            1_000_000_000,  // 10 APT
            10_000_000_000, // 100 APT
            vector::empty(),
            0,
        );

        // Should fail - not enough funds
        membership::purchase_membership(poor_member, creator_addr, 0, 1);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // Test 7: Membership expiry
    #[test(aptos_framework = @0x1, creator = @0x123, member = @0x789)]
    fun test_membership_expiry(
        aptos_framework: &signer,
        creator: &signer,
        member: &signer,
    ) {
        let (burn_cap, mint_cap) = setup_test(aptos_framework, creator, member);

        let creator_addr = signer::address_of(creator);
        let member_addr = signer::address_of(member);

        membership::initialize_registry(creator, @0x456);
        membership::create_tier(
            creator,
            string::utf8(b"Monthly"),
            1_000_000,
            10_000_000,
            vector::empty(),
            0,
        );

        // Purchase 1-month membership
        membership::purchase_membership(member, creator_addr, 0, 1);

        // Should be active now
        assert!(membership::is_member(creator_addr, member_addr), 0);

        // Fast forward 31 days (2,678,400 seconds)
        timestamp::fast_forward_seconds(2_678_400);

        // Should be expired
        assert!(!membership::is_member(creator_addr, member_addr), 1);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // Test 8: Tier switching updates counts (AFTER FIX)
    #[test(aptos_framework = @0x1, creator = @0x123, member = @0x789)]
    fun test_tier_switching_counts(
        aptos_framework: &signer,
        creator: &signer,
        member: &signer,
    ) {
        let (burn_cap, mint_cap) = setup_test(aptos_framework, creator, member);

        let creator_addr = signer::address_of(creator);

        membership::initialize_registry(creator, @0x456);

        // Create two tiers
        membership::create_tier(
            creator,
            string::utf8(b"Basic"),
            1_000_000,
            10_000_000,
            vector::empty(),
            0,
        );

        membership::create_tier(
            creator,
            string::utf8(b"Premium"),
            5_000_000,
            50_000_000,
            vector::empty(),
            0,
        );

        // Purchase Basic tier
        membership::purchase_membership(member, creator_addr, 0, 1);

        // Check Basic tier has 1 member
        let (_, _, _, _, basic_count, _) = membership::get_tier(creator_addr, 0);
        assert!(basic_count == 1, 0);

        // Switch to Premium tier
        membership::purchase_membership(member, creator_addr, 1, 1);

        // Check Basic tier has 0 members (AFTER FIX)
        let (_, _, _, _, basic_count2, _) = membership::get_tier(creator_addr, 0);
        assert!(basic_count2 == 0, 1);

        // Check Premium tier has 1 member
        let (_, _, _, _, premium_count, _) = membership::get_tier(creator_addr, 1);
        assert!(premium_count == 1, 2);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // Test 9: Cancel membership
    #[test(aptos_framework = @0x1, creator = @0x123, member = @0x789)]
    fun test_cancel_membership(
        aptos_framework: &signer,
        creator: &signer,
        member: &signer,
    ) {
        let (burn_cap, mint_cap) = setup_test(aptos_framework, creator, member);

        let creator_addr = signer::address_of(creator);
        let member_addr = signer::address_of(member);

        membership::initialize_registry(creator, @0x456);
        membership::create_tier(
            creator,
            string::utf8(b"Monthly"),
            1_000_000,
            10_000_000,
            vector::empty(),
            0,
        );

        // Purchase and enable auto-renew
        membership::purchase_membership(member, creator_addr, 0, 1);

        let (_, _, _, auto_renew_before) = membership::get_membership(creator_addr, member_addr);
        // Note: Need to add set_auto_renew function first

        // Cancel membership (disables auto-renew)
        membership::cancel_membership(member, creator_addr);

        let (_, _, _, auto_renew_after) = membership::get_membership(creator_addr, member_addr);
        assert!(auto_renew_after == false, 0);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // Test 10: Tier not found
    #[test(aptos_framework = @0x1, creator = @0x123, member = @0x789)]
    #[expected_failure(abort_code = membership::E_TIER_NOT_FOUND)]
    fun test_tier_not_found(
        aptos_framework: &signer,
        creator: &signer,
        member: &signer,
    ) {
        let (burn_cap, mint_cap) = setup_test(aptos_framework, creator, member);

        let creator_addr = signer::address_of(creator);

        membership::initialize_registry(creator, @0x456);

        // Try to purchase non-existent tier
        membership::purchase_membership(member, creator_addr, 99, 1);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // Test 11: Overflow protection (AFTER FIX)
    #[test(aptos_framework = @0x1, creator = @0x123, member = @0x789)]
    #[expected_failure(abort_code = membership::E_OVERFLOW)]
    fun test_overflow_protection(
        aptos_framework: &signer,
        creator: &signer,
        member: &signer,
    ) {
        let (burn_cap, mint_cap) = setup_test(aptos_framework, creator, member);

        let creator_addr = signer::address_of(creator);

        membership::initialize_registry(creator, @0x456);
        membership::create_tier(
            creator,
            string::utf8(b"Test"),
            1_000_000_000_000,  // Very high price
            10_000_000_000_000,
            vector::empty(),
            0,
        );

        // Try to purchase with ridiculous duration
        membership::purchase_membership(member, creator_addr, 0, 18446744073709551615);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // Test 12: Withdrawal tracking and available balance
    #[test(aptos_framework = @0x1, creator = @0x123, member = @0x789, withdrawal_addr = @0x456)]
    fun test_withdrawal_tracking(
        aptos_framework: &signer,
        creator: &signer,
        member: &signer,
        withdrawal_addr: &signer,
    ) {
        let (burn_cap, mint_cap) = setup_test(aptos_framework, creator, member);

        // Register withdrawal address for AptosCoin
        coin::register<AptosCoin>(withdrawal_addr);

        let creator_addr = signer::address_of(creator);
        let withdrawal_address = signer::address_of(withdrawal_addr);

        membership::initialize_registry(creator, withdrawal_address);
        membership::create_tier(
            creator,
            string::utf8(b"Test"),
            1_000_000,
            10_000_000,
            vector::empty(),
            0,
        );

        // Purchase membership
        membership::purchase_membership(member, creator_addr, 0, 1);

        // Check available balance
        let available = membership::get_available_balance(creator_addr);
        assert!(available == 1_000_000, 0);

        // Withdraw half
        membership::withdraw_revenue(creator, 500_000);

        // Check available balance decreased
        let available_after = membership::get_available_balance(creator_addr);
        assert!(available_after == 500_000, 1);

        // Verify withdrawal address received funds
        let balance = coin::balance<AptosCoin>(withdrawal_address);
        assert!(balance == 500_000, 2);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // Test 13: Cannot withdraw more than available
    #[test(aptos_framework = @0x1, creator = @0x123, member = @0x789)]
    #[expected_failure(abort_code = membership::E_INSUFFICIENT_BALANCE)]
    fun test_withdrawal_exceeds_balance(
        aptos_framework: &signer,
        creator: &signer,
        member: &signer,
    ) {
        let (burn_cap, mint_cap) = setup_test(aptos_framework, creator, member);

        let creator_addr = signer::address_of(creator);

        membership::initialize_registry(creator, @0x456);
        membership::create_tier(
            creator,
            string::utf8(b"Test"),
            1_000_000,
            10_000_000,
            vector::empty(),
            0,
        );

        // Purchase membership (1M octas)
        membership::purchase_membership(member, creator_addr, 0, 1);

        // Try to withdraw more than available
        membership::withdraw_revenue(creator, 2_000_000);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // Test 14: Cleanup expired membership
    #[test(aptos_framework = @0x1, creator = @0x123, member = @0x789)]
    fun test_cleanup_expired_membership(
        aptos_framework: &signer,
        creator: &signer,
        member: &signer,
    ) {
        let (burn_cap, mint_cap) = setup_test(aptos_framework, creator, member);

        let creator_addr = signer::address_of(creator);
        let member_addr = signer::address_of(member);

        membership::initialize_registry(creator, @0x456);
        membership::create_tier(
            creator,
            string::utf8(b"Monthly"),
            1_000_000,
            10_000_000,
            vector::empty(),
            0,
        );

        // Purchase membership
        membership::purchase_membership(member, creator_addr, 0, 1);

        // Verify tier has 1 member
        let (_, _, _, _, count_before, _) = membership::get_tier(creator_addr, 0);
        assert!(count_before == 1, 0);

        // Fast forward past expiry
        timestamp::fast_forward_seconds(2_678_400);

        // Cleanup expired membership
        membership::cleanup_expired_membership(creator_addr, member_addr);

        // Verify tier count decremented
        let (_, _, _, _, count_after, _) = membership::get_tier(creator_addr, 0);
        assert!(count_after == 0, 1);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // Test 15: Cannot cleanup active membership
    #[test(aptos_framework = @0x1, creator = @0x123, member = @0x789)]
    #[expected_failure(abort_code = membership::E_MEMBERSHIP_EXPIRED)]
    fun test_cleanup_active_membership_fails(
        aptos_framework: &signer,
        creator: &signer,
        member: &signer,
    ) {
        let (burn_cap, mint_cap) = setup_test(aptos_framework, creator, member);

        let creator_addr = signer::address_of(creator);
        let member_addr = signer::address_of(member);

        membership::initialize_registry(creator, @0x456);
        membership::create_tier(
            creator,
            string::utf8(b"Monthly"),
            1_000_000,
            10_000_000,
            vector::empty(),
            0,
        );

        // Purchase membership
        membership::purchase_membership(member, creator_addr, 0, 1);

        // Try to cleanup active membership (should fail)
        membership::cleanup_expired_membership(creator_addr, member_addr);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // Test 16: Update tier status
    #[test(aptos_framework = @0x1, creator = @0x123)]
    fun test_update_tier_status(
        aptos_framework: &signer,
        creator: &signer,
    ) {
        let (burn_cap, mint_cap) = setup_test(aptos_framework, creator, creator);

        let creator_addr = signer::address_of(creator);

        membership::initialize_registry(creator, @0x456);
        membership::create_tier(
            creator,
            string::utf8(b"Test"),
            1_000_000,
            10_000_000,
            vector::empty(),
            0,
        );

        // Verify tier is active
        let (_, _, _, _, _, active_before) = membership::get_tier(creator_addr, 0);
        assert!(active_before == true, 0);

        // Deactivate tier
        membership::update_tier_status(creator, 0, false);

        // Verify tier is inactive
        let (_, _, _, _, _, active_after) = membership::get_tier(creator_addr, 0);
        assert!(active_after == false, 1);

        // Reactivate tier
        membership::update_tier_status(creator, 0, true);

        // Verify tier is active again
        let (_, _, _, _, _, active_final) = membership::get_tier(creator_addr, 0);
        assert!(active_final == true, 2);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // Test 17: Invalid duration (zero months)
    #[test(aptos_framework = @0x1, creator = @0x123, member = @0x789)]
    #[expected_failure(abort_code = membership::E_INVALID_DURATION)]
    fun test_invalid_duration_zero(
        aptos_framework: &signer,
        creator: &signer,
        member: &signer,
    ) {
        let (burn_cap, mint_cap) = setup_test(aptos_framework, creator, member);

        let creator_addr = signer::address_of(creator);

        membership::initialize_registry(creator, @0x456);
        membership::create_tier(
            creator,
            string::utf8(b"Test"),
            1_000_000,
            10_000_000,
            vector::empty(),
            0,
        );

        // Try to purchase with 0 months duration
        membership::purchase_membership(member, creator_addr, 0, 0);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // Test 18: Invalid duration (exceeds max)
    #[test(aptos_framework = @0x1, creator = @0x123, member = @0x789)]
    #[expected_failure(abort_code = membership::E_OVERFLOW)]
    fun test_invalid_duration_exceeds_max(
        aptos_framework: &signer,
        creator: &signer,
        member: &signer,
    ) {
        let (burn_cap, mint_cap) = setup_test(aptos_framework, creator, member);

        let creator_addr = signer::address_of(creator);

        membership::initialize_registry(creator, @0x456);
        membership::create_tier(
            creator,
            string::utf8(b"Test"),
            1_000_000,
            10_000_000,
            vector::empty(),
            0,
        );

        // Try to purchase with duration > 1200 months
        membership::purchase_membership(member, creator_addr, 0, 1201);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // Test 19: Multiple purchases accumulate revenue correctly
    #[test(aptos_framework = @0x1, creator = @0x123, member1 = @0x789, member2 = @0x7890)]
    fun test_revenue_accumulation(
        aptos_framework: &signer,
        creator: &signer,
        member1: &signer,
        member2: &signer,
    ) {
        let (burn_cap, mint_cap) = setup_test(aptos_framework, creator, member1);

        // Register member2 and mint using existing mint_cap
        coin::register<AptosCoin>(member2);
        let coins = coin::mint<AptosCoin>(10_000_000_000, &mint_cap);
        coin::deposit(signer::address_of(member2), coins);

        let creator_addr = signer::address_of(creator);

        membership::initialize_registry(creator, @0x456);
        membership::create_tier(
            creator,
            string::utf8(b"Test"),
            1_000_000,  // 1M octas
            10_000_000,
            vector::empty(),
            0,
        );

        // Initial balance
        let available_start = membership::get_available_balance(creator_addr);
        assert!(available_start == 0, 0);

        // First purchase
        membership::purchase_membership(member1, creator_addr, 0, 1);
        let available_after_1 = membership::get_available_balance(creator_addr);
        assert!(available_after_1 == 1_000_000, 1);

        // Second purchase
        membership::purchase_membership(member2, creator_addr, 0, 1);
        let available_after_2 = membership::get_available_balance(creator_addr);
        assert!(available_after_2 == 2_000_000, 2);

        // Withdraw some
        membership::withdraw_revenue(creator, 500_000);
        let available_after_withdrawal = membership::get_available_balance(creator_addr);
        assert!(available_after_withdrawal == 1_500_000, 3);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // Test 20: Get total tiers
    #[test(aptos_framework = @0x1, creator = @0x123)]
    fun test_get_total_tiers(
        aptos_framework: &signer,
        creator: &signer,
    ) {
        let (burn_cap, mint_cap) = setup_test(aptos_framework, creator, creator);

        let creator_addr = signer::address_of(creator);

        membership::initialize_registry(creator, @0x456);

        // Initially 0 tiers
        assert!(membership::get_total_tiers(creator_addr) == 0, 0);

        // Create first tier
        membership::create_tier(
            creator,
            string::utf8(b"Basic"),
            1_000_000,
            10_000_000,
            vector::empty(),
            0,
        );
        assert!(membership::get_total_tiers(creator_addr) == 1, 1);

        // Create second tier
        membership::create_tier(
            creator,
            string::utf8(b"Premium"),
            5_000_000,
            50_000_000,
            vector::empty(),
            0,
        );
        assert!(membership::get_total_tiers(creator_addr) == 2, 2);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }
}
