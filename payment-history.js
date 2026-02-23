import { initHeader } from './components/header.js';
import { initFooter } from './components/footer.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const STATUS_MAP = {
  completed: { label: '결제완료', cls: 'bg-green-100 text-green-700' },
  pending:   { label: '처리중',   cls: 'bg-yellow-100 text-yellow-700' },
  failed:    { label: '실패',     cls: 'bg-red-100 text-red-600' },
  refunded:  { label: '환불',     cls: 'bg-gray-100 text-gray-500' },
};

function statusBadge(status) {
  const s = STATUS_MAP[status] || { label: status || '-', cls: 'bg-gray-100 text-gray-500' };
  return `<span class="inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${s.cls}">${s.label}</span>`;
}

async function init() {
  await initHeader({ page: 'payment-history', apiBaseUrl: API_BASE_URL });
  initFooter();

  const token = localStorage.getItem('auth_token');

  if (!token) {
    document.getElementById('list-loading').classList.add('hidden');
    document.getElementById('list-unauth').classList.remove('hidden');
    return;
  }

  const res = await fetch(`${API_BASE_URL}/api/payments`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  document.getElementById('list-loading').classList.add('hidden');

  if (res.status === 401) {
    document.getElementById('list-unauth').classList.remove('hidden');
    return;
  }

  const { payments } = await res.json();

  if (!payments || payments.length === 0) {
    document.getElementById('list-empty').classList.remove('hidden');
    return;
  }

  document.getElementById('list-container').classList.remove('hidden');

  const container = document.getElementById('list-container');
  container.innerHTML = payments.map(p => `
    <div class="bg-white rounded-2xl border border-[#e8eaf0] shadow-sm p-5">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="flex-1 min-w-0">
          <p class="text-base font-bold text-[#111318] truncate">${p.product_name || '크레딧 패키지'}</p>
          <p class="text-xs text-[#636e88] mt-0.5">${formatDate(p.created_at)}</p>
        </div>
        ${statusBadge(p.status)}
      </div>
      <div class="flex items-center justify-between pt-3 border-t border-[#f0f1f4]">
        <div class="flex items-center gap-1.5">
          <img src="assets/images/credit.png" class="w-4 h-4" alt="크레딧">
          <span class="text-sm font-semibold text-primary">${(p.credit_amount || 0).toLocaleString()} C 지급</span>
        </div>
        <p class="text-base font-bold text-[#111318]">
          ${(p.amount || 0).toLocaleString()}원
          ${p.provider ? `<span class="text-xs text-[#636e88] font-normal ml-1">(${p.provider})</span>` : ''}
        </p>
      </div>
    </div>
  `).join('');
}

init();
