import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

const migrationSql = readFileSync(join(__dirname, "drizzle/0001_new_junta.sql"), "utf-8");

console.log("Running migration...");
console.log(migrationSql);

const statements = migrationSql
  .split("--> statement-breakpoint")
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith("--"));

try {
  for (const statement of statements) {
    console.log(`\nExecuting: ${statement.substring(0, 100)}...`);
    await pool.query(statement);
    console.log("✓ Success");
  }

  console.log("\n✅ Migration completed successfully!");
} catch (error) {
  console.error("✗ Error:", error);
  throw error;
} finally {
  await pool.end();
}

process.exit(0);
