import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { applyTranslations, t } from '../components/i18n.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';

// 상품 정의 (pricing.html 카드 순서와 동일)
const PRODUCTS = [
  { id: 'starter', name: 'Starter',  amount: 3000,  credits: 10  },
  { id: 'growth',  name: 'Growth',   amount: 5000,  credits: 20  },
  { id: 'pro',     name: 'Pro',      amount: 12000, credits: 50  },
  { id: 'power',   name: 'Power',    amount: 25000, credits: 120 },
];

let tossClientKey = null;

document.title = t('pricing.page_title');
initHeader({ page: 'pricing', apiBaseUrl: API_BASE_URL });
initFooter();
applyTranslations();

async function init() {
  // Toss 클라이언트 키 로드
  try {
    const res = await fetch(`${API_BASE_URL}/api/payments/config`);
    const data = await res.json();
    tossClientKey = data.clientKey;
  } catch {
    console.error('[Pricing] Failed to load payment config');
  }

  // 충전하기 버튼에 data-product-id 속성으로 핸들러 등록
  const buttons = document.querySelectorAll('[data-product-id]');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => handlePurchase(btn.dataset.productId));
  });
}

function generateOrderId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `ord-${ts}-${rand}`;
}

async function handlePurchase(productId) {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    alert(t('pricing.login_required'));
    location.href = '/';
    return;
  }

  if (!tossClientKey) {
    alert(t('pricing.payment_error'));
    return;
  }

  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const orderId = generateOrderId();

  // 1. 서버에 pending 결제 저장 (금액 무결성 기준점)
  try {
    const prepRes = await fetch(`${API_BASE_URL}/api/payments/prepare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId, productId }),
    });
    if (!prepRes.ok) {
      const err = await prepRes.json().catch(() => ({}));
      alert(err.error || t('pricing.prepare_error'));
      return;
    }
  } catch {
    alert(t('pricing.network_error'));
    return;
  }

  // 2. Toss SDK로 결제창 열기
  try {
    const tossPayments = window.TossPayments(tossClientKey);
    const payment = tossPayments.payment({ customerKey: window.TossPayments.ANONYMOUS });

    await payment.requestPayment({
      method: 'CARD',
      amount: { currency: 'KRW', value: product.amount },
      orderId,
      orderName: `TalonInsight ${product.name} 크레딧 ${product.credits}개 (운영사 : HealthTier labs)`,
      successUrl: `${window.location.origin}/payment/payment-success.html`,
      failUrl: `${window.location.origin}/payment/payment-fail.html`,
    });
  } catch (err) {
    // 사용자가 결제창을 닫은 경우 — 조용히 처리
    if (err?.code !== 'USER_CANCEL') {
      console.error('[Pricing] Payment error:', err);
    }
  }
}

init();
