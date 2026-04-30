import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Create users table (new schema)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        provider TEXT NOT NULL DEFAULT 'email',
        provider_id TEXT,
        avatar_url TEXT,
        team TEXT,
        position TEXT,
        preferred_foot TEXT,
        age INTEGER,
        password_hash TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Add new columns and make old required columns nullable (handles existing table migration)
    const userAlters = [
      // New columns
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'email'",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS team TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS position TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_foot TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT now()",
      // Make old columns nullable so they don't block inserts
      "ALTER TABLE users ALTER COLUMN username DROP NOT NULL",
      "ALTER TABLE users ALTER COLUMN password DROP NOT NULL",
      // Add unique constraint on email if not exists
      "ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email)",
    ];
    for (const sql of userAlters) {
      await client.query(sql).catch(() => {});
    }

    // Create diary_entries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS diary_entries (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        mood INTEGER NOT NULL,
        duration_minutes INTEGER NOT NULL,
        notes TEXT,
        skills JSONB NOT NULL DEFAULT '[]'::jsonb,
        video_url TEXT,
        media_type TEXT,
        xp_awarded INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create waitlist table
    await client.query(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await client.query("COMMIT");
    console.log("Migration completed successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
