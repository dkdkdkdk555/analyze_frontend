const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';

async function confirm() {
  const params = new URLSearchParams(location.search);
  const paymentKey = params.get('paymentKey');
  const orderId    = params.get('orderId');
  const amount     = Number(params.get('amount'));

  if (!paymentKey || !orderId || !amount) {
    showError('결제 정보가 올바르지 않아요.');
    return;
  }

  const token = localStorage.getItem('auth_token');
  if (!token) {
    showError('로그인이 필요해요.');
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
      showError(data.error || '결제 승인에 실패했어요.');
      return;
    }

    showSuccess(data.creditAmount);
  } catch {
    showError('네트워크 오류가 발생했어요.');
  }
}

function showSuccess(creditAmount) {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('success-state').classList.remove('hidden');
  document.getElementById('success-msg').textContent =
    `${creditAmount}크레딧이 충전됐어요. 이제 분석을 마음껏 이용해 보세요!`;
}

function showError(message) {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('error-state').classList.remove('hidden');
  document.getElementById('error-msg').textContent = message;
}

confirm();
