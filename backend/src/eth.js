const ETHERSCAN_BASE = 'https://api.etherscan.io/api';

export async function fetchTransactions(address, apiKey) {
  const url = new URL(ETHERSCAN_BASE);
  url.searchParams.set('module', 'account');
  url.searchParams.set('action', 'txlist');
  url.searchParams.set('address', address);
  url.searchParams.set('startblock', '0');
  url.searchParams.set('endblock', '99999999');
  url.searchParams.set('sort', 'asc');
  url.searchParams.set('apikey', apiKey ?? '');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Запрос к Etherscan завершился ошибкой: ${response.status}`);
  }
  const data = await response.json();
  if (data.status !== '1' && data.message !== 'No transactions found') {
    throw new Error(`Ошибка Etherscan: ${data.message || 'неизвестная ошибка'}`);
  }

  return Array.isArray(data.result) ? data.result : [];
}

export function parseEtherValue(value) {
  const wei = BigInt(value);
  const eth = Number(wei) / 1e18;
  return eth;
}
