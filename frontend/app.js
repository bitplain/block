const DEFAULT_ADDRESS = '0xaAcCAf0C21Ad6D1d048E56171ABdabAf60B717dc';

const addressInput = document.getElementById('address');
const syncButton = document.getElementById('sync');
const txBody = document.getElementById('tx-body');
const totalIncomingEl = document.getElementById('total-incoming');
const totalOutgoingEl = document.getElementById('total-outgoing');
const avgPriceEl = document.getElementById('avg-price');
const txCountEl = document.getElementById('tx-count');
const logList = document.getElementById('log-list');

let chartInstance = null;

function getApiBase() {
  return '/api';
}

function formatEth(value) {
  return Number(value).toFixed(4);
}

function formatUsd(value) {
  if (value === null || value === undefined) return '—';
  return `$${Number(value).toFixed(2)}`;
}

function saveAddress(value) {
  if (!value) return;
  localStorage.setItem('ethAddress', value);
}

function loadAddress() {
  return localStorage.getItem('ethAddress') || '';
}

function addLog(message, status = 'info') {
  const item = document.createElement('div');
  item.className = `log-item ${status}`;
  const time = new Date().toLocaleTimeString();
  item.innerHTML = `<span>${message}</span><time>${time}</time>`;
  logList.prepend(item);
}

function clearLogs() {
  logList.innerHTML = '';
}

function buildRow(tx) {
  const row = document.createElement('tr');
  const typeClass = tx.tx_type === 'incoming' ? 'incoming' : 'outgoing';
  const typeLabel = tx.tx_type === 'incoming' ? 'входящая' : 'исходящая';
  row.innerHTML = `
    <td>${new Date(tx.tx_timestamp).toLocaleString()}</td>
    <td class="${typeClass}">${typeLabel}</td>
    <td>${formatEth(tx.amount_eth)}</td>
    <td>${formatUsd(tx.price_usd)}</td>
    <td>${tx.from_address}</td>
    <td>${tx.to_address}</td>
  `;
  return row;
}

function renderEmptyRow() {
  const row = document.createElement('tr');
  row.innerHTML = '<td class="empty" colspan="6">Транзакций пока нет.</td>';
  return row;
}

function updateStats(transactions) {
  const incoming = transactions.filter((tx) => tx.tx_type === 'incoming');
  const outgoing = transactions.filter((tx) => tx.tx_type === 'outgoing');

  const incomingTotal = incoming.reduce((sum, tx) => sum + Number(tx.amount_eth), 0);
  const outgoingTotal = outgoing.reduce((sum, tx) => sum + Number(tx.amount_eth), 0);

  const pricePoints = incoming.filter((tx) => tx.price_usd !== null);
  const avgPrice =
    pricePoints.reduce((sum, tx) => sum + Number(tx.price_usd), 0) /
    (pricePoints.length || 1);

  totalIncomingEl.textContent = formatEth(incomingTotal);
  totalOutgoingEl.textContent = formatEth(outgoingTotal);
  avgPriceEl.textContent = formatUsd(avgPrice);
  txCountEl.textContent = transactions.length.toString();
}

function updateChart(transactions) {
  const incoming = transactions
    .filter((tx) => tx.tx_type === 'incoming' && tx.price_usd !== null)
    .sort((a, b) => new Date(a.tx_timestamp) - new Date(b.tx_timestamp));

  const labels = incoming.map((tx) => new Date(tx.tx_timestamp).toLocaleDateString());
  const prices = incoming.map((tx) => Number(tx.price_usd));

  const ctx = document.getElementById('price-chart');
  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Цена ETH (USD)',
          data: prices,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.2)',
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: '#94a3b8' },
          grid: { color: 'rgba(148, 163, 184, 0.2)' },
        },
        y: {
          ticks: { color: '#94a3b8' },
          grid: { color: 'rgba(148, 163, 184, 0.2)' },
        },
      },
      plugins: {
        legend: {
          labels: { color: '#e5e7eb' },
        },
      },
    },
  });
}

async function loadTransactions(address) {
  const response = await fetch(`${getApiBase()}/transactions?address=${address}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Не удалось загрузить транзакции');
  }
  return data.transactions || [];
}

async function syncTransactions(address) {
  const response = await fetch(`${getApiBase()}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Не удалось синхронизировать данные');
  }
  return data;
}

async function refresh() {
  const address = addressInput.value.trim();
  if (!address) return;
  saveAddress(address);
  addLog('Загружаю сохраненные транзакции...', 'info');
  const transactions = await loadTransactions(address);
  txBody.innerHTML = '';
  if (!transactions.length) {
    txBody.appendChild(renderEmptyRow());
  } else {
    transactions.forEach((tx) => txBody.appendChild(buildRow(tx)));
  }
  updateStats(transactions);
  updateChart(transactions);
  addLog(`Транзакций загружено: ${transactions.length}`, 'success');
}

async function runSyncFlow() {
  const address = addressInput.value.trim();
  if (!address) return;
  clearLogs();
  addLog('Запускаю синхронизацию с Etherscan...', 'info');
  try {
    const result = await syncTransactions(address);
    addLog(`Синхронизация завершена. Найдено: ${result.synced}`, 'success');
    await refresh();
  } catch (error) {
    addLog(error.message, 'error');
    throw error;
  }
}

syncButton.addEventListener('click', async () => {
  const address = addressInput.value.trim();
  if (!address) return;
  syncButton.disabled = true;
  syncButton.textContent = 'Синхронизация...';
  try {
    await runSyncFlow();
  } catch (error) {
    alert(error.message);
  } finally {
    syncButton.disabled = false;
    syncButton.textContent = 'Синхронизировать';
  }
});

window.addEventListener('load', async () => {
  const savedAddress = loadAddress();
  addressInput.value = savedAddress || DEFAULT_ADDRESS;
  if (!savedAddress) {
    saveAddress(DEFAULT_ADDRESS);
  }

  try {
    await runSyncFlow();
  } catch (error) {
    addLog('Не удалось выполнить автосинхронизацию.', 'error');
  }
});
