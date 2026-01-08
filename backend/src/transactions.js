import { query } from './db.js';

export async function upsertTransaction(tx) {
  const sql = `
    INSERT INTO transactions (
      tx_hash,
      tx_timestamp,
      amount_eth,
      price_usd,
      tx_type,
      from_address,
      to_address
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (tx_hash)
    DO UPDATE SET
      tx_timestamp = EXCLUDED.tx_timestamp,
      amount_eth = EXCLUDED.amount_eth,
      price_usd = EXCLUDED.price_usd,
      tx_type = EXCLUDED.tx_type,
      from_address = EXCLUDED.from_address,
      to_address = EXCLUDED.to_address;
  `;

  const params = [
    tx.hash,
    tx.timestamp,
    tx.amountEth,
    tx.priceUsd,
    tx.type,
    tx.from,
    tx.to,
  ];

  await query(sql, params);
}

export async function listTransactions(address) {
  const sql = `
    SELECT *
    FROM transactions
    WHERE lower(from_address) = lower($1)
       OR lower(to_address) = lower($1)
    ORDER BY tx_timestamp DESC;
  `;
  const result = await query(sql, [address]);
  return result.rows;
}
