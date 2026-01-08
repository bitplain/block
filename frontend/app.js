const addressInput = document.getElementById('address');
const syncButton = document.getElementById('sync');
const txBody = document.getElementById('tx-body');
const totalIncomingEl = document.getElementById('total-incoming');
const totalOutgoingEl = document.getElementById('total-outgoing');
const avgPriceEl = document.getElementById('avg-price');
const txCountEl = document.getElementById('tx-count');

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

function buildRow(tx) {
  const row = document.createElement('tr');
  const typeClass = tx.tx_type === 'incoming' ? 'incoming' : 'outgoing';
  row.innerHTML = `
    <td>${new Date(tx.tx_timestamp).toLocaleString()}</td>
    <td class="${typeClass}">${tx.tx_type}</td>
    <td>${formatEth(tx.amount_eth)}</td>
    <td>${formatUsd(tx.price_usd)}</td>
    <td>${tx.from_address}</td>
    <td>${tx.to_address}</td>
  `;
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
          label: 'ETH Price (USD)',
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
    throw new Error(data.error || 'Failed to load transactions');
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
    throw new Error(data.error || 'Failed to sync');
  }
  return data;
}

async function refresh() {
  const address = addressInput.value.trim();
  if (!address) return;
  saveAddress(address);
  const transactions = await loadTransactions(address);
  txBody.innerHTML = '';
  transactions.forEach((tx) => txBody.appendChild(buildRow(tx)));
  updateStats(transactions);
  updateChart(transactions);
}

syncButton.addEventListener('click', async () => {
  const address = addressInput.value.trim();
  if (!address) return;
  syncButton.disabled = true;
  syncButton.textContent = 'Syncing...';
  try {
    await syncTransactions(address);
    await refresh();
  } catch (error) {
    alert(error.message);
  } finally {
    syncButton.disabled = false;
    syncButton.textContent = 'Sync';
  }
});

window.addEventListener('load', async () => {
  const savedAddress = loadAddress();
  if (savedAddress) {
    addressInput.value = savedAddress;
    try {
      await refresh();
    } catch (error) {
      console.warn(error);
    }
  }
});
