import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(databaseUrl);

async function migrateSchema() {
  console.log("Starting schema migration...");

  try {
    console.log("Dropping existing tables...");
    await sql`DROP TABLE IF EXISTS access_logs CASCADE`;
    await sql`DROP TABLE IF EXISTS revenue_events CASCADE`;
    await sql`DROP TABLE IF EXISTS notifications CASCADE`;
    await sql`DROP TABLE IF EXISTS content CASCADE`;
    await sql`DROP TABLE IF EXISTS posts CASCADE`;
    await sql`DROP TABLE IF EXISTS memberships_cache CASCADE`;
    await sql`DROP TABLE IF EXISTS membership_tiers_cache CASCADE`;
    await sql`DROP TABLE IF EXISTS creator_profiles CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;

    console.log("Creating users table...");
    await sql`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        wallet_address TEXT NOT NULL UNIQUE,
        username TEXT,
        email TEXT,
        bio TEXT,
        avatar_url TEXT,
        is_creator BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX users_wallet_idx ON users(wallet_address)`;
    await sql`CREATE INDEX users_creator_idx ON users(is_creator)`;

    console.log("Creating creator_profiles table...");
    await sql`
      CREATE TABLE creator_profiles (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        display_name TEXT NOT NULL,
        banner_url TEXT,
        social_links JSONB,
        total_revenue TEXT NOT NULL DEFAULT '0',
        total_members INTEGER NOT NULL DEFAULT 0,
        category TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX creator_profiles_category_idx ON creator_profiles(category)`;

    console.log("Creating membership_tiers_cache table...");
    await sql`
      CREATE TABLE membership_tiers_cache (
        id TEXT PRIMARY KEY,
        creator_wallet TEXT NOT NULL,
        tier_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        price_monthly TEXT NOT NULL,
        price_yearly TEXT NOT NULL,
        benefits JSONB NOT NULL,
        max_members INTEGER NOT NULL,
        current_members INTEGER NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        synced_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX tiers_creator_idx ON membership_tiers_cache(creator_wallet)`;
    await sql`CREATE INDEX tiers_creator_tier_idx ON membership_tiers_cache(creator_wallet, tier_id)`;

    console.log("Creating memberships_cache table...");
    await sql`
      CREATE TABLE memberships_cache (
        id TEXT PRIMARY KEY,
        member_wallet TEXT NOT NULL,
        creator_wallet TEXT NOT NULL,
        tier_id INTEGER NOT NULL,
        start_time TIMESTAMP NOT NULL,
        expiry_time TIMESTAMP NOT NULL,
        auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
        synced_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX memberships_member_idx ON memberships_cache(member_wallet)`;
    await sql`CREATE INDEX memberships_creator_idx ON memberships_cache(creator_wallet)`;
    await sql`CREATE INDEX memberships_member_creator_idx ON memberships_cache(member_wallet, creator_wallet)`;

    console.log("Creating posts table...");
    await sql`
      CREATE TABLE posts (
        id TEXT PRIMARY KEY,
        creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        post_type TEXT NOT NULL DEFAULT 'text',
        tier_requirement INTEGER,
        is_public BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX posts_creator_idx ON posts(creator_id)`;
    await sql`CREATE INDEX posts_public_idx ON posts(is_public)`;
    await sql`CREATE INDEX posts_tier_idx ON posts(tier_requirement)`;

    console.log("Creating content table...");
    await sql`
      CREATE TABLE content (
        id TEXT PRIMARY KEY,
        creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        creator_wallet TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        content_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        duration INTEGER,
        tier_requirement INTEGER,
        is_public BOOLEAN NOT NULL DEFAULT FALSE,
        shelby_cid TEXT NOT NULL,
        shelby_blob_url TEXT NOT NULL,
        shelby_chunkset_id TEXT,
        session_id_used_for_upload TEXT,
        stream_count INTEGER NOT NULL DEFAULT 0,
        view_count INTEGER NOT NULL DEFAULT 0,
        uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        thumbnail_url TEXT
      )
    `;

    await sql`CREATE INDEX content_creator_idx ON content(creator_id)`;
    await sql`CREATE INDEX content_creator_wallet_idx ON content(creator_wallet)`;
    await sql`CREATE INDEX content_public_idx ON content(is_public)`;
    await sql`CREATE INDEX content_tier_idx ON content(tier_requirement)`;

    console.log("Creating notifications table...");
    await sql`
      CREATE TABLE notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN NOT NULL DEFAULT FALSE,
        link TEXT,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX notifications_user_idx ON notifications(user_id)`;
    await sql`CREATE INDEX notifications_read_idx ON notifications(read)`;
    await sql`CREATE INDEX notifications_user_read_idx ON notifications(user_id, read)`;

    console.log("Creating revenue_events table...");
    await sql`
      CREATE TABLE revenue_events (
        id TEXT PRIMARY KEY,
        creator_wallet TEXT NOT NULL,
        member_wallet TEXT NOT NULL,
        amount TEXT NOT NULL,
        event_type TEXT NOT NULL,
        tier_id INTEGER,
        transaction_hash TEXT,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX revenue_creator_idx ON revenue_events(creator_wallet)`;
    await sql`CREATE INDEX revenue_member_idx ON revenue_events(member_wallet)`;
    await sql`CREATE INDEX revenue_type_idx ON revenue_events(event_type)`;
    await sql`CREATE INDEX revenue_tx_idx ON revenue_events(transaction_hash)`;

    console.log("Creating access_logs table...");
    await sql`
      CREATE TABLE access_logs (
        id TEXT PRIMARY KEY,
        user_wallet TEXT NOT NULL,
        content_id TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
        access_type TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        accessed_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX access_user_idx ON access_logs(user_wallet)`;
    await sql`CREATE INDEX access_content_idx ON access_logs(content_id)`;
    await sql`CREATE INDEX access_type_idx ON access_logs(access_type)`;

    console.log("Schema migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

migrateSchema();
