import { applyTranslations, t } from '../components/i18n.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';

document.title = t('payment.success_page_title');
applyTranslations();

async function confirm() {
  const params = new URLSearchParams(location.search);
  const paymentKey = params.get('paymentKey');
  const orderId    = params.get('orderId');
  const amount     = Number(params.get('amount'));

  if (!paymentKey || !orderId || !amount) {
    showError(t('payment.invalid_info'));
    return;
  }

  const token = localStorage.getItem('auth_token');
  if (!token) {
    showError(t('payment.login_required'));
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/payments/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.error || t('payment.confirm_error'));
      return;
    }

    showSuccess(data.creditAmount);
  } catch {
    showError(t('payment.network_error'));
  }
}

function showSuccess(creditAmount) {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('success-state').classList.remove('hidden');
  document.getElementById('success-msg').textContent =
    t('payment.success_msg').replace('{n}', creditAmount);
}

function showError(message) {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('error-state').classList.remove('hidden');
  document.getElementById('error-msg').textContent = message;
}

confirm();
