import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const TYPE_LABEL = {
  charge: '충전',
  use: '사용',
  refund: '환불',
  bonus: '보너스',
  expire: '만료',
};

function typeLabel(type) {
  return TYPE_LABEL[type] || type || '-';
}

async function init() {
  await initHeader({ page: 'credit-history', apiBaseUrl: API_BASE_URL });
  initFooter();

  const token = localStorage.getItem('auth_token');

  if (!token) {
    document.getElementById('list-loading').classList.add('hidden');
    document.getElementById('list-unauth').classList.remove('hidden');
    return;
  }

  // 잔여 크레딧 조회
  const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (meRes.ok) {
    const { user } = await meRes.json();
    if (user) {
      document.getElementById('credit-balance').textContent = `${(user.credit_balance ?? 0).toLocaleString()} C`;
      document.getElementById('credit-summary').classList.remove('hidden');
    }
  }

  // 크레딧 내역 조회
  const res = await fetch(`${API_BASE_URL}/api/credits/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  document.getElementById('list-loading').classList.add('hidden');

  if (res.status === 401) {
    document.getElementById('list-unauth').classList.remove('hidden');
    return;
  }

  const { ledger } = await res.json();

  if (!ledger || ledger.length === 0) {
    document.getElementById('list-empty').classList.remove('hidden');
    return;
  }

  document.getElementById('list-container').classList.remove('hidden');

  const tbody = document.getElementById('ledger-tbody');
  tbody.innerHTML = ledger.map(entry => {
    const isPositive = entry.amount > 0;
    const amountClass = isPositive ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold';
    const amountText = `${isPositive ? '+' : ''}${entry.amount.toLocaleString()} C`;

    return `
      <tr class="border-b border-[#f0f1f4] last:border-0 hover:bg-[#f8f9ff] transition-colors">
        <td class="px-5 py-4 text-sm text-[#636e88] whitespace-nowrap">${formatDate(entry.created_at)}</td>
        <td class="px-5 py-4">
          <div class="flex items-center gap-2">
            <span class="inline-block px-2 py-0.5 text-xs font-medium rounded-full ${isPositive ? 'bg-green-100 text-green-700' : 'bg-[#f0f1f4] text-[#636e88]'}">${typeLabel(entry.type)}</span>
            <span class="text-sm text-[#111318]">${entry.description || '-'}</span>
          </div>
        </td>
        <td class="px-5 py-4 text-right text-sm ${amountClass}">${amountText}</td>
      </tr>
    `;
  }).join('');
}

init();
