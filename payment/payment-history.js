import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { getLang, t, applyTranslations } from '../components/i18n.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const locale = getLang() === 'en' ? 'en-US' : 'ko-KR';
  return d.toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const STATUS_CLS = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-600',
  refunded: 'bg-gray-100 text-gray-500',
};

function statusBadge(status) {
  const labelKey = `payment.status_${status}`;
  const label = t(labelKey) !== labelKey ? t(labelKey) : (status || '-');
  const cls = STATUS_CLS[status] || 'bg-gray-100 text-gray-500';
  return `<span class="inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${cls}">${label}</span>`;
}

function formatAmount(amount) {
  const num = (amount || 0).toLocaleString();
  return getLang() === 'en' ? `KRW ${num}` : `${num}원`;
}

async function init() {
  await initHeader({ page: 'payment-history', apiBaseUrl: API_BASE_URL });
  initFooter();
  applyTranslations();
  document.title = t('payment.history_page_title');

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
          <p class="text-base font-bold text-[#111318] truncate">${p.product_name || t('payment.credit_package')}</p>
          <p class="text-xs text-[#636e88] mt-0.5">${formatDate(p.created_at)}</p>
        </div>
        ${statusBadge(p.status)}
      </div>
      <div class="flex items-center justify-between pt-3 border-t border-[#f0f1f4]">
        <div class="flex items-center gap-1.5">
          <span class="text-sm font-semibold text-primary">${(p.credit_amount || 0).toLocaleString()} ${t('payment.credit_given')}</span>
        </div>
        <p class="text-base font-bold text-[#111318]">
          ${formatAmount(p.amount)}
          ${p.provider ? `<span class="text-xs text-[#636e88] font-normal ml-1">(${p.provider})</span>` : ''}
        </p>
      </div>
    </div>
  `).join('');
}

init();
