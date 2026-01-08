const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const priceCache = new Map();

function formatDateForCoinGecko(date) {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

export async function getEthPriceUsd(date) {
  const key = date.toISOString().slice(0, 10);
  if (priceCache.has(key)) {
    return priceCache.get(key);
  }

  const url = new URL(`${COINGECKO_BASE}/coins/ethereum/history`);
  url.searchParams.set('date', formatDateForCoinGecko(date));
  url.searchParams.set('localization', 'false');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Запрос к CoinGecko завершился ошибкой: ${response.status}`);
  }
  const data = await response.json();
  const price = data?.market_data?.current_price?.usd ?? null;
  priceCache.set(key, price);
  return price;
}
