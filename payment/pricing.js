import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { applyTranslations, t, getLang } from '../components/i18n.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';

// 상품 정의 (amount = USD cents)
const PRODUCTS = [
  { id: 'starter', name: 'Starter',  amount: 300,   credits: 10  },
  { id: 'growth',  name: 'Growth',   amount: 590,   credits: 20  },
  { id: 'pro',     name: 'Pro',      amount: 1450,  credits: 50  },
  { id: 'power',   name: 'Power',    amount: 3360,  credits: 120 },
];

let paypalClientId       = null;
let paddleClientToken    = null;
let paddleEnvironment    = 'production';
let paddlePrices         = {};
let paypalSDKLoaded      = false;
let paddleSDKLoaded      = false;
let selectedProduct      = null;

// Paddle 결제 흐름 상태
let paddleCheckoutCompleted    = false;

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
const providerSelect    = document.getElementById('modal-provider-select');
const paypalView        = document.getElementById('modal-paypal-view');
const paddleView        = document.getElementById('modal-paddle-view');
const paddleStatus      = document.getElementById('modal-paddle-status');
const paypalKoWarning   = document.getElementById('paypal-ko-warning');

// ── View 관리 ──────────────────────────────────────────────────────────────
function showPlanView(view) {
  // view: 'select' | 'paypal' | 'paddle'
  providerSelect.classList.toggle('hidden', view !== 'select');
  paypalView.classList.toggle('hidden', view !== 'paypal');
  paddleView.classList.toggle('hidden', view !== 'paddle');

  if (view !== 'paypal') {
    document.getElementById('paypal-button-container').innerHTML = '';
  }

  if (view === 'select') {
    // 한국어인 경우 PayPal 불가 말풍선 표시
    paypalKoWarning.classList.toggle('hidden', getLang() !== 'ko');
  }
}

function showModalState(state) {
  // state: 'plan' | 'success' | 'error'
  modalPlanInfo.classList.toggle('hidden', state !== 'plan');
  modalSuccess.classList.toggle('hidden', state !== 'success');
  modalError.classList.toggle('hidden', state !== 'error');
}

function openModal() {
  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
}

function showModalSuccess(creditAmount) {
  modalSuccessMsg.textContent = t('pricing.success_msg').replace('{n}', creditAmount);
  showModalState('success');
}

function showModalError(message) {
  modalErrorMsg.textContent = message;
  showModalState('error');
}

function resetModal() {
  showPlanView('select');
  showModalState('plan');
}

// ── 이벤트 바인딩 ──────────────────────────────────────────────────────────
modalBackdrop.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);
modalSuccessClose.addEventListener('click', () => { closeModal(); location.reload(); });
modalErrorClose.addEventListener('click', closeModal);
modalRetry.addEventListener('click', resetModal);

document.getElementById('btn-select-paypal').addEventListener('click', () => {
  showPlanView('paypal');
  renderPayPalButtons();
});

document.getElementById('btn-select-paddle').addEventListener('click', () => {
  handlePaddlePayment();
});

document.getElementById('modal-back-paypal').addEventListener('click', () => {
  showPlanView('select');
});

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
async function renderPayPalButtons() {
  if (!paypalClientId) {
    showModalError(t('pricing.payment_error'));
    return;
  }

  const token = localStorage.getItem('auth_token');

  try {
    await loadPayPalSDK(paypalClientId);
  } catch {
    showModalError(t('pricing.payment_error'));
    return;
  }

  if (!window.paypal) {
    showModalError(t('pricing.payment_error'));
    return;
  }

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
        body: JSON.stringify({ paypalOrderId: data.orderID, productId: selectedProduct.id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Payment capture failed');
      showModalSuccess(result.creditAmount);
    },

    onError: (err) => {
      console.error('[Payment] PayPal error:', err);
      showModalError(t('pricing.payment_error'));
    },

    onCancel: () => {
      showPlanView('select');
    },
  }).render('#paypal-button-container');
}

// ── Paddle SDK 동적 로드 ───────────────────────────────────────────────────
function loadPaddleSDK() {
  if (paddleSDKLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.onload = () => {
      if (paddleEnvironment === 'sandbox') {
        window.Paddle.Environment.set('sandbox');
      }
      window.Paddle.Initialize({
        token: paddleClientToken,
        eventCallback: (event) => {
          if (event.name === 'checkout.completed') {
            paddleCheckoutCompleted = true;
            // 검증 즉시 시작
            if (paddleStatus) paddleStatus.textContent = t('pricing.paddle_verifying');
            completePaddlePayment(event.data.transaction_id);
          }
          if (event.name === 'checkout.closed') {
            if (!paddleCheckoutCompleted) {
              // 사용자가 결제 없이 닫음 → 수단 선택 화면으로
              showPlanView('select');
              showModalState('plan');
            }
            paddleCheckoutCompleted = false;
          }
        },
      });
      paddleSDKLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ── Paddle 결제 완료 검증 ──────────────────────────────────────────────────
async function completePaddlePayment(transactionId) {
  const token = localStorage.getItem('auth_token');
  try {
    const res = await fetch(`${API_BASE_URL}/api/payments/paddle/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ transactionId, productId: selectedProduct.id }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || t('pricing.payment_error'));
    showModalSuccess(result.creditAmount);
  } catch (err) {
    console.error('[Payment] Paddle complete error:', err);
    showModalError(err.message || t('pricing.payment_error'));
  }
}

// ── Paddle 결제 흐름 ───────────────────────────────────────────────────────
async function handlePaddlePayment() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    showModalError(t('pricing.login_required'));
    return;
  }

  showPlanView('paddle');
  if (paddleStatus) paddleStatus.textContent = t('pricing.paddle_loading');
  paddleCheckoutCompleted = false;

  try {
    // Paddle SDK 로드 (이미 로드된 경우 즉시 resolve)
    await loadPaddleSDK();

    // 백엔드에서 Paddle transaction 생성
    const res = await fetch(`${API_BASE_URL}/api/payments/paddle/create-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId: selectedProduct.id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || t('pricing.payment_error'));

    // Paddle Checkout 열기
    window.Paddle.Checkout.open({ transactionId: data.transactionId });
  } catch (err) {
    console.error('[Payment] Paddle create transaction error:', err);
    showModalError(err.message || t('pricing.payment_error'));
  }
}

// ── 구매 핸들러 ────────────────────────────────────────────────────────────
async function handlePurchase(productId) {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    alert(t('pricing.login_required'));
    location.href = '/';
    return;
  }

  selectedProduct = PRODUCTS.find(p => p.id === productId);
  if (!selectedProduct) return;

  modalPlanName.textContent = `${selectedProduct.name} — ${selectedProduct.credits} Credits`;
  modalPlanPrice.textContent = `$${(selectedProduct.amount / 100).toFixed(2)}`;

  resetModal();
  openModal();
}

// ── 초기화 ─────────────────────────────────────────────────────────────────
async function init() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/payments/config`);
    const data = await res.json();
    paypalClientId    = data.paypalClientId;
    paddleClientToken = data.paddleClientToken;
    paddleEnvironment = data.paddleEnvironment || 'production';
    paddlePrices      = data.paddlePrices || {};
  } catch {
    console.error('[Pricing] Failed to load payment config');
  }

  const buttons = document.querySelectorAll('[data-product-id]');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => handlePurchase(btn.dataset.productId));
  });
}

init();
