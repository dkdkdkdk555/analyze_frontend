import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { applyTranslations, t } from '../components/i18n.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';

// 상품 정의 (amount = USD cents)
const PRODUCTS = [
  { id: 'starter', name: 'Starter',  amount: 300,   credits: 10  },
  { id: 'growth',  name: 'Growth',   amount: 590,   credits: 20  },
  { id: 'pro',     name: 'Pro',      amount: 1450,  credits: 50  },
  { id: 'power',   name: 'Power',    amount: 3360,  credits: 120 },
];

let paypalClientId = null;
let paypalSDKLoaded = false;
let selectedProduct = null;

document.title = t('pricing.page_title');
initHeader({ page: 'pricing', apiBaseUrl: API_BASE_URL });
initFooter();
applyTranslations();

// ── Modal elements ─────────────────────────────────────────────────────────
const modal             = document.getElementById('payment-modal');
const modalBackdrop     = document.getElementById('modal-backdrop');
const modalClose        = document.getElementById('modal-close');
const modalPlanInfo     = document.getElementById('modal-plan-info');
const modalPlanName     = document.getElementById('modal-plan-name');
const modalPlanPrice    = document.getElementById('modal-plan-price');
const modalSuccess      = document.getElementById('modal-success');
const modalSuccessMsg   = document.getElementById('modal-success-msg');
const modalSuccessClose = document.getElementById('modal-success-close');
const modalError        = document.getElementById('modal-error');
const modalErrorMsg     = document.getElementById('modal-error-msg');
const modalRetry        = document.getElementById('modal-retry');
const modalErrorClose   = document.getElementById('modal-error-close');

function openModal()  { modal.classList.remove('hidden'); }
function closeModal() { modal.classList.add('hidden'); }

function showModalSuccess(creditAmount) {
  modalPlanInfo.classList.add('hidden');
  modalError.classList.add('hidden');
  modalSuccess.classList.remove('hidden');
  modalSuccessMsg.textContent = `${creditAmount} credits have been added to your account.`;
}

function showModalError(message) {
  document.getElementById('paypal-button-container').innerHTML = '';
  modalPlanInfo.classList.add('hidden');
  modalSuccess.classList.add('hidden');
  modalError.classList.remove('hidden');
  modalErrorMsg.textContent = message;
}

function resetModal() {
  document.getElementById('paypal-button-container').innerHTML = '';
  modalPlanInfo.classList.remove('hidden');
  modalSuccess.classList.add('hidden');
  modalError.classList.add('hidden');
}

modalBackdrop.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);
modalSuccessClose.addEventListener('click', () => { closeModal(); location.reload(); });
modalErrorClose.addEventListener('click', closeModal);
modalRetry.addEventListener('click', () => { resetModal(); renderPayPalButtons(); });

// ── PayPal SDK 동적 로드 ───────────────────────────────────────────────────
function loadPayPalSDK(clientId) {
  if (paypalSDKLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
    script.onload = () => { paypalSDKLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ── PayPal 버튼 렌더링 ─────────────────────────────────────────────────────
function renderPayPalButtons() {
  const token = localStorage.getItem('auth_token');

  window.paypal.Buttons({
    style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' },

    createOrder: async () => {
      const res = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: selectedProduct.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');
      return data.paypalOrderId;
    },

    onApprove: async (data) => {
      const res = await fetch(`${API_BASE_URL}/api/payments/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paypalOrderId: data.orderID }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Payment capture failed');
      showModalSuccess(result.creditAmount);
    },

    onError: (err) => {
      console.error('[Payment] PayPal error:', err);
      showModalError('A payment error occurred. Please try again.');
    },

    onCancel: () => {
      closeModal();
    },
  }).render('#paypal-button-container');
}

// ── 구매 핸들러 ────────────────────────────────────────────────────────────
async function handlePurchase(productId) {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    alert(t('pricing.login_required'));
    location.href = '/';
    return;
  }

  if (!paypalClientId) {
    alert(t('pricing.payment_error' + ':paypalClientId'));
    return;
  }

  selectedProduct = PRODUCTS.find(p => p.id === productId);
  if (!selectedProduct) return;

  modalPlanName.textContent = `${selectedProduct.name} — ${selectedProduct.credits} Credits`;
  modalPlanPrice.textContent = `$${(selectedProduct.amount / 100).toFixed(2)}`;

  resetModal();
  openModal();

  try {
    await loadPayPalSDK(paypalClientId);
  } catch {
    showModalError(t('pricing.payment_error' + ':loadPayPalSDK'));
    return;
  }

  // SDK 로드 후 window.paypal 초기화 확인
  if (!window.paypal) {
    showModalError(t('pricing.payment_error' + ':window.paypal'));
    return;
  }

  try {
    renderPayPalButtons();
  } catch (err) {
    console.error('[Payment] renderPayPalButtons error:', err);
    showModalError(t('pricing.payment_error' + ':renderPayPalButtons'));
  }
}

// ── 초기화 ─────────────────────────────────────────────────────────────────
async function init() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/payments/config`);
    const data = await res.json();
    paypalClientId = data.paypalClientId;
  } catch {
    console.error('[Pricing] Failed to load payment config');
  }

  const buttons = document.querySelectorAll('[data-product-id]');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => handlePurchase(btn.dataset.productId));
  });
}

init();
