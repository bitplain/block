# Ethereum Portfolio Terminal Dashboard

A full-screen, terminal-styled dashboard that analyzes an Ethereum address, stores transaction data, and shows historical ETH prices at the time of each incoming transaction. The project is fully containerized with Docker.

## Features

- Fetches all incoming and outgoing transactions for a configured Ethereum address via Etherscan.
- Resolves historical ETH/USD price per incoming transaction via CoinGecko.
- Stores data in PostgreSQL with upsert support.
- Terminal-inspired responsive UI with charts, full-viewport layout, and mobile optimization.
- Dockerized backend, frontend, and database with health checks.

## Project Structure

```
backend/       # Node.js/Express API + PostgreSQL integration
frontend/      # Static terminal-style dashboard served by Nginx
.env.example   # Environment variable template
Dockerfile     # Service build files
```

## Configuration

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Update `.env` with your credentials:

- `ETHERSCAN_API_KEY`: API key for https://etherscan.io/apis
- `ETH_ADDRESS`: Ethereum address to analyze

## Running with Docker

Build and start everything:

```bash
docker-compose up --build
```

Stop services:

```bash
docker-compose down
```

The dashboard will be available at:

```
http://localhost:8080
```

## API Endpoints

- `GET /api/transactions?address=0x...` - Retrieve stored transactions for an address.
- `POST /api/sync` - Sync transactions from Etherscan and store in the database.

Example:

```bash
curl -X POST http://localhost:8080/api/sync \
  -H "Content-Type: application/json" \
  -d '{"address": "0xYourEthereumAddress"}'
```

## Notes

- CoinGecko rate limits apply. For large transaction histories, the first sync may take time.
- Transaction values are stored in ETH and price history is stored in USD.
