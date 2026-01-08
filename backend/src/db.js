import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        tx_hash TEXT PRIMARY KEY,
        tx_timestamp TIMESTAMPTZ NOT NULL,
        amount_eth NUMERIC(36, 18) NOT NULL,
        price_usd NUMERIC(18, 8),
        tx_type TEXT NOT NULL,
        from_address TEXT NOT NULL,
        to_address TEXT NOT NULL
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS transactions_timestamp_idx
      ON transactions (tx_timestamp DESC);
    `);
  } finally {
    client.release();
  }
}

export function query(text, params) {
  return pool.query(text, params);
}

export async function closeDb() {
  await pool.end();
}
