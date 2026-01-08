import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import { fetchTransactions, parseEtherValue } from './eth.js';
import { getEthPriceUsd } from './prices.js';
import { listTransactions, upsertTransaction } from './transactions.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/transactions', async (req, res) => {
  const address = req.query.address || process.env.ETH_ADDRESS;
  if (!address) {
    return res.status(400).json({ error: 'Требуется ETH-адрес.' });
  }

  try {
    const rows = await listTransactions(address);
    return res.json({ address, transactions: rows });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/sync', async (req, res) => {
  const address = (req.body?.address || process.env.ETH_ADDRESS || '').trim();
  if (!address) {
    return res.status(400).json({ error: 'Требуется ETH-адрес.' });
  }

  try {
    const apiKey = process.env.ETHERSCAN_API_KEY;
    const txs = await fetchTransactions(address, apiKey);

    for (const tx of txs) {
      const timestamp = new Date(Number(tx.timeStamp) * 1000);
      const amountEth = parseEtherValue(tx.value);
      const isIncoming = tx.to?.toLowerCase() === address.toLowerCase();
      const txType = isIncoming ? 'incoming' : 'outgoing';
      let priceUsd = null;

      if (isIncoming) {
        try {
          priceUsd = await getEthPriceUsd(timestamp);
        } catch (priceError) {
          console.warn('Не удалось получить цену', priceError.message);
        }
      }

      await upsertTransaction({
        hash: tx.hash,
        timestamp,
        amountEth,
        priceUsd,
        type: txType,
        from: tx.from,
        to: tx.to,
      });
    }

    return res.json({
      address,
      synced: txs.length,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

async function start() {
  await initDb();
  app.listen(port, () => {
    console.log(`Backend слушает порт ${port}`);
  });
}

start().catch((error) => {
  console.error('Не удалось запустить backend', error);
  process.exit(1);
});
