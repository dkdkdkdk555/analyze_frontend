import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { getLang, t, applyTranslations } from '../components/i18n.js';
import { clearToken } from '../components/auth.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const locale = getLang() === 'en' ? 'en-US' : 'ko-KR';
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

async function init() {
  await initHeader({ page: 'mypage', apiBaseUrl: API_BASE_URL });
  initFooter();
  applyTranslations();
  document.title = t('mypage.page_title');

  const token = localStorage.getItem('auth_token');

  if (!token) {
    document.getElementById('list-loading').classList.add('hidden');
    document.getElementById('list-unauth').classList.remove('hidden');
    return;
  }

  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  document.getElementById('list-loading').classList.add('hidden');

  if (!res.ok) {
    document.getElementById('list-unauth').classList.remove('hidden');
    return;
  }

  const { user } = await res.json();
  if (!user) {
    document.getElementById('list-unauth').classList.remove('hidden');
    return;
  }

  // 프로필 카드 렌더링
  const card = document.getElementById('profile-card');
  card.classList.remove('hidden');

  const initial = (user.name || user.email || '?')[0].toUpperCase();
  document.getElementById('profile-avatar').textContent = initial;
  document.getElementById('profile-name').textContent  = user.name || '-';
  document.getElementById('profile-email').textContent = user.email || '-';
  document.getElementById('info-name').textContent     = user.name || '-';
  document.getElementById('info-email').textContent    = user.email || '-';
  document.getElementById('info-joined').textContent   = formatDate(user.created_at);

  // 회원탈퇴 모달 제어
  const modal        = document.getElementById('delete-modal');
  const openBtn      = document.getElementById('delete-account-btn');
  const cancelBtn    = document.getElementById('delete-cancel-btn');
  const confirmChk   = document.getElementById('delete-confirm-chk');
  const confirmChk2  = document.getElementById('delete-confirm-chk2');
  const confirmBtn   = document.getElementById('delete-confirm-btn');

  const updateConfirmBtn = () => {
    confirmBtn.disabled = !(confirmChk.checked && confirmChk2.checked);
  };

  openBtn.addEventListener('click', () => {
    confirmChk.checked = false;
    confirmChk2.checked = false;
    confirmBtn.disabled = true;
    modal.classList.remove('hidden');
  });

  cancelBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  confirmChk.addEventListener('change', updateConfirmBtn);
  confirmChk2.addEventListener('change', updateConfirmBtn);

  confirmBtn.addEventListener('click', async () => {
    confirmBtn.disabled = true;
    try {
      const delRes = await fetch(`${API_BASE_URL}/api/auth/delete-account`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!delRes.ok) {
        const err = await delRes.json().catch(() => ({}));
        alert(err.error || t('mypage.delete_error'));
        confirmBtn.disabled = false;
        return;
      }

      // 탈퇴 완료: 토큰 삭제 후 홈으로
      clearToken();
      modal.classList.add('hidden');
      alert(t('mypage.delete_success'));
      window.location.href = '/';
    } catch {
      alert(t('mypage.delete_error'));
      confirmBtn.disabled = false;
    }
  });
}

init();
