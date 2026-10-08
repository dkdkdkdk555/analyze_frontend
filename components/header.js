/**
 * Common header component
 * @param {Object} options
 * @param {'index' | 'analysis' | 'pricing' | 'blog' | 'services'} options.page
 * @param {string} options.apiBaseUrl
 */
import { t, getLang, setLang, getMarket } from './i18n.js';

export async function initHeader({ page, apiBaseUrl }) {
  const headerEl = document.getElementById('app-header');
  if (!headerEl) return;

  // 1. Render header immediately (logged-out state for layout stability)
  headerEl.innerHTML = buildHeaderHTML({ page });
  attachMobileMenuHandlers();
  attachLangSwitcherHandlers();
  if (page === 'analysis' && apiBaseUrl) initHeaderSearch(apiBaseUrl);

  // 2. Process token from URL → localStorage (async: exchanges one-time code for JWT)
  const { handleTokenFromURL, fetchCurrentUser, logout, setToken } = await import('./auth.js');
  const { consentToken } = await handleTokenFromURL(apiBaseUrl);

  // 3. Fetch current user → update auth UI
  const user = apiBaseUrl ? await fetchCurrentUser(apiBaseUrl) : null;
  updateAuthUI(user);

  // 4. If new user, show consent modal before creating account in DB
  if (consentToken) {
    showConsentModal(consentToken, apiBaseUrl, setToken, fetchCurrentUser, updateAuthUI);
  }

  // Event delegation: login / logout / profile dropdown
  headerEl.addEventListener('click', (e) => {
    const loginBtn  = e.target.closest('[data-action="login"]');
    const logoutBtn = e.target.closest('[data-action="logout"]');
    const profileBtn = e.target.closest('[data-action="profile"]');

    if (loginBtn) {
      window.location.href = `${apiBaseUrl}/api/auth/google`;
    }

    if (logoutBtn) {
      if (window.confirm(t('auth.logout_confirm'))) {
        logout();
        updateAuthUI(null);
      }
    }

    if (profileBtn) {
      const dropdown = document.getElementById('profile-dropdown');
      if (dropdown) dropdown.classList.toggle('hidden');
    }
  });

  // Close profile dropdown on outside click
  document.addEventListener('click', (e) => {
    const dropdown  = document.getElementById('profile-dropdown');
    const container = document.getElementById('profile-menu-container');
    if (dropdown && container && !container.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });
}

// ─── Auth UI ────────────────────────────────────────────────────────────────

function updateAuthUI(user) {
  const desktopArea = document.getElementById('desktop-auth-area');
  const mobileArea  = document.getElementById('mobile-auth-area');
  if (desktopArea) desktopArea.innerHTML = buildDesktopAuth(user);
  if (mobileArea)  mobileArea.innerHTML  = buildMobileAuth(user);
}

function buildDesktopAuth(user) {
  if (user) {
    const initial = (user.name || user.email || '?')[0].toUpperCase();
    const credit  = user.credit_balance ?? 0;
    return `
      <div id="profile-menu-container" class="relative max-md:hidden">
        <button data-action="profile" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0f1f4] hover:bg-gray-200 transition-all cursor-pointer select-none">
          <div class="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">${initial}</div>
          <span class="text-xs font-medium text-[#111318] max-w-[90px] truncate">${user.name || user.email}</span>
          <span class="material-symbols-outlined text-[#636e88] text-sm leading-none">expand_more</span>
        </button>

        <div id="profile-dropdown" class="hidden absolute top-[calc(100%+8px)] right-0 w-52 bg-white rounded-xl border border-[#dcdee5] shadow-xl z-50 overflow-hidden">
          <div class="px-4 py-3 bg-[#f8f9ff] border-b border-[#e8eaf0] flex items-center justify-between">
            <span class="text-xs text-[#636e88] font-medium">${t('auth.remaining_credits')}</span>
            <span class="text-sm font-black text-primary">${credit.toLocaleString()} C</span>
          </div>
          <div class="py-1">
            <a href="/mypage/mypage.html" class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#111318] hover:bg-[#f0f1f4] transition-colors">
              <span class="material-symbols-outlined text-[#636e88] text-lg">person</span>
              ${t('auth.my_page')}
            </a>
            <a href="/mypage/my-analyses.html" class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#111318] hover:bg-[#f0f1f4] transition-colors">
              <span class="material-symbols-outlined text-[#636e88] text-lg">analytics</span>
              ${t('auth.my_analyses')}
            </a>
            <a href="/mypage/credit-history.html" class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#111318] hover:bg-[#f0f1f4] transition-colors">
              <span class="material-symbols-outlined text-[#636e88] text-lg">toll</span>
              ${t('auth.credit_history')}
            </a>
            <a href="/payment/payment-history.html" class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#111318] hover:bg-[#f0f1f4] transition-colors">
              <span class="material-symbols-outlined text-[#636e88] text-lg">receipt_long</span>
              ${t('auth.payment_history')}
            </a>
          </div>
          <div class="border-t border-[#f0f1f4] py-1">
            <button data-action="logout" class="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
              <span class="material-symbols-outlined text-lg">logout</span>
              ${t('auth.logout')}
            </button>
          </div>
        </div>
      </div>
    `;
  }
  return `
    <button data-action="login" class="flex items-center gap-2 min-w-[140px] justify-center rounded-lg h-9 md:h-10 px-3 md:px-4 border border-[#dcdee5] bg-white text-[#111318] text-xs md:text-sm font-medium hover:bg-[#f0f1f4] transition-all max-md:hidden">
      <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Login with Google
    </button>
  `;
}

function buildMobileAuth(user) {
  if (user) {
    const initial = (user.name || user.email || '?')[0].toUpperCase();
    const credit  = user.credit_balance ?? 0;
    return `
      <div class="border-t border-[#e5e7eb]">
        <div class="px-5 py-4 bg-[#f8f9ff] border-b border-[#e8eaf0]">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">${initial}</div>
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-bold text-[#111318] truncate">${user.name || ''}</span>
              <span class="text-xs text-[#636e88] truncate">${user.email}</span>
            </div>
          </div>
          <div class="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-[#e8eaf0]">
            <span class="text-xs text-[#636e88] font-medium">${t('auth.remaining_credits')}</span>
            <span class="text-sm font-black text-primary">${credit.toLocaleString()} C</span>
          </div>
        </div>
        <div class="px-5 py-2">
          <a href="/mypage/mypage.html" class="flex items-center gap-3 py-3 text-sm font-medium text-[#111318] border-b border-[#f0f1f4] hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-lg text-[#636e88]">person</span>
            ${t('auth.my_page')}
          </a>
          <a href="/mypage/my-analyses.html" class="flex items-center gap-3 py-3 text-sm font-medium text-[#111318] border-b border-[#f0f1f4] hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-lg text-[#636e88]">analytics</span>
            ${t('auth.my_analyses')}
          </a>
          <a href="/mypage/credit-history.html" class="flex items-center gap-3 py-3 text-sm font-medium text-[#111318] border-b border-[#f0f1f4] hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-lg text-[#636e88]">toll</span>
            ${t('auth.credit_history')}
          </a>
          <a href="/payment/payment-history.html" class="flex items-center gap-3 py-3 text-sm font-medium text-[#111318] hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-lg text-[#636e88]">receipt_long</span>
            ${t('auth.payment_history')}
          </a>
        </div>
        <div class="px-5 py-3 border-t border-[#f0f1f4]">
          <button data-action="logout" class="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors">
            <span class="material-symbols-outlined text-lg">logout</span>
            ${t('auth.logout')}
          </button>
        </div>
      </div>
    `;
  }
  return `
    <div class="px-5 py-4 border-t border-[#e5e7eb]">
      <button data-action="login" class="w-full flex items-center justify-center gap-2 rounded-lg h-11 px-4 border border-[#dcdee5] bg-white text-[#111318] text-sm font-medium hover:bg-[#f0f1f4] transition-all">
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Login with Google
      </button>
    </div>
  `;
}

// ─── Welcome Credit Modal (new user, credits granted) ────────────────────────

let _confettiAnimId = null;

function showWelcomeCreditModal() {
  const modal = document.createElement('div');
  modal.id = 'welcome-credit-modal';
  modal.className = 'fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4';
  modal.innerHTML = `
    <canvas id="confetti-canvas" style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:200;"></canvas>
    <div class="relative bg-white rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center" style="z-index:201;">
      <div class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <span class="material-symbols-outlined text-primary" style="font-size:36px;font-variation-settings:'FILL' 1">card_giftcard</span>
      </div>
      <h3 class="text-xl font-bold text-[#111318] mb-3">${t('signup.welcome_title')}</h3>
      <div class="inline-flex items-center gap-1.5 bg-primary/10 text-primary font-bold text-sm px-4 py-2 rounded-full mb-4">
        <span class="material-symbols-outlined text-base" style="font-variation-settings:'FILL' 1">stars</span>
        ${t('signup.welcome_credit_badge')}
      </div>
      <p class="text-sm text-[#636e88] leading-relaxed mb-6 whitespace-pre-line">${t('signup.welcome_msg')}</p>
      <button id="close-welcome-modal" class="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors">${t('signup.welcome_confirm')}</button>
    </div>
  `;
  document.body.appendChild(modal);
  _startConfetti();

  modal.querySelector('#close-welcome-modal')?.addEventListener('click', () => {
    _stopConfetti();
    modal.remove();
  });
}

function _startConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#1E5AE8', '#60a5fa', '#f59e0b', '#10b981', '#f43f5e', '#a855f7', '#fbbf24'];
  const particles = Array.from({ length: 130 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    r: Math.random() * 5 + 4,
    d: Math.random() * 80 + 20,
    color: colors[Math.floor(Math.random() * colors.length)],
    tiltAngle: Math.random() * Math.PI * 2,
    tiltAngleInc: Math.random() * 0.07 + 0.04,
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.tiltAngle += p.tiltAngleInc;
      p.y += (Math.cos(p.d) + 2.5 + p.r / 2) * 0.7;
      const tilt = Math.sin(p.tiltAngle) * 12;
      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + tilt + p.r / 4, p.y);
      ctx.lineTo(p.x + tilt, p.y + tilt + p.r / 4);
      ctx.stroke();
      if (p.y > canvas.height) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
    });
    _confettiAnimId = requestAnimationFrame(draw);
  }
  draw();
}

function _stopConfetti() {
  if (_confettiAnimId) {
    cancelAnimationFrame(_confettiAnimId);
    _confettiAnimId = null;
  }
}

// ─── Duplicate Credit Modal ──────────────────────────────────────────────────

function showDuplicateCreditModal() {
  // Check if modal already exists in DOM
  const existingModal = document.getElementById('duplicate-credit-modal');
  if (existingModal) {
    existingModal.classList.remove('hidden');
    return;
  }

  // Create modal dynamically
  const modal = document.createElement('div');
  modal.id = 'duplicate-credit-modal-dynamic';
  modal.className = 'fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center">
      <div class="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
        <span class="material-symbols-outlined text-amber-600" style="font-size:28px">info</span>
      </div>
      <h3 class="text-lg font-bold text-[#111318] mb-3">${t('signup.duplicate_title')}</h3>
      <p class="text-sm text-[#636e88] leading-relaxed mb-5 whitespace-pre-line">${t('signup.duplicate_msg')}</p>
      <button id="close-duplicate-modal-dynamic" class="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors">${t('signup.duplicate_confirm')}</button>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('#close-duplicate-modal-dynamic')?.addEventListener('click', () => {
    modal.remove();
  });
}

// ─── Consent Modal ───────────────────────────────────────────────────────────

function showConsentModal(token, apiBaseUrl, setToken, fetchCurrentUser, updateAuthUI) {
  const modal = document.createElement('div');
  modal.id = 'consent-modal';
  modal.className = 'fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
      <h2 class="text-xl font-bold text-[#111318] mb-2">${t('auth.consent_title')}</h2>
      <p class="text-sm text-[#636e88] mb-6">${t('auth.consent_desc')}</p>
      <div class="space-y-4 mb-8">
        <label class="flex items-start gap-3 cursor-pointer select-none">
          <input type="checkbox" id="consent-terms-chk" class="mt-0.5 w-4 h-4 accent-primary rounded border-gray-300 shrink-0">
          <span class="text-sm text-[#111318]">
            <a href="/terms" target="_blank" class="text-primary underline hover:text-blue-700">${t('auth.consent_terms_link')}</a>${t('auth.consent_agree_suffix')}
          </span>
        </label>
        <label class="flex items-start gap-3 cursor-pointer select-none">
          <input type="checkbox" id="consent-privacy-chk" class="mt-0.5 w-4 h-4 accent-primary rounded border-gray-300 shrink-0">
          <span class="text-sm text-[#111318]">
            <a href="/privacy" target="_blank" class="text-primary underline hover:text-blue-700">${t('auth.consent_privacy_link')}</a>${t('auth.consent_agree_suffix')}
          </span>
        </label>
        <label class="flex items-start gap-3 cursor-pointer select-none">
          <input type="checkbox" id="consent-survey-email-chk" class="mt-0.5 w-4 h-4 accent-primary rounded border-gray-300 shrink-0">
          <span class="text-sm text-[#636e88]">${t('auth.consent_survey_email_label')}</span>
        </label>
      </div>
      <div class="flex flex-col gap-3">
        <button id="consent-confirm-btn" disabled class="w-full h-11 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-blue-700 transition-colors">
          ${t('auth.consent_button')}
        </button>
        <button id="consent-cancel-btn" class="w-full h-11 rounded-xl border border-[#dcdee5] text-sm font-medium text-[#636e88] hover:bg-[#f0f1f4] transition-colors">
          ${t('auth.consent_cancel')}
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const termsChk       = modal.querySelector('#consent-terms-chk');
  const privacyChk     = modal.querySelector('#consent-privacy-chk');
  const surveyEmailChk = modal.querySelector('#consent-survey-email-chk');
  const confirmBtn     = modal.querySelector('#consent-confirm-btn');
  const cancelBtn      = modal.querySelector('#consent-cancel-btn');

  function updateConfirmState() {
    confirmBtn.disabled = !(termsChk.checked && privacyChk.checked);
  }
  termsChk.addEventListener('change', updateConfirmState);
  privacyChk.addEventListener('change', updateConfirmState);

  confirmBtn.addEventListener('click', async () => {
    confirmBtn.disabled = true;
    try {
      // Get fingerprint for duplicate detection
      let fingerprintId = null;
      try {
        const { getVisitorId } = await import('./fingerprint.js');
        fingerprintId = await getVisitorId();
      } catch (fpError) {
        console.warn('[Consent] Fingerprint error:', fpError);
      }

      const res = await fetch(`${apiBaseUrl}/api/auth/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentToken: token, fingerprintId, emailSurveyConsent: surveyEmailChk.checked }),
      });
      const data = await res.json();
      if (!res.ok || !data.authToken) throw new Error(data.error || 'consent failed');
      setToken(data.authToken);
      modal.remove();

      // Show appropriate modal based on credit status
      if (data.skipWelcomeCredit) {
        showDuplicateCreditModal();
      } else {
        showWelcomeCreditModal();
      }

      const user = apiBaseUrl ? await fetchCurrentUser(apiBaseUrl) : null;
      updateAuthUI(user);
    } catch (err) {
      console.error('[Consent] Error:', err);
      confirmBtn.disabled = false;
    }
  });

  cancelBtn.addEventListener('click', () => {
    modal.remove();
  });
}

// ─── Header HTML ─────────────────────────────────────────────────────────────

function buildHeaderHTML({ page }) {
  const logoHTML = `
    <a href="https://taloninsight.com" class="flex items-center gap-2 md:gap-3 shrink-0">
      <svg class="size-7 md:size-8" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 8 C14 8 11 16 10 24 C9 30 12 36 15 38 C16 38.5 17 38 17 37 C17 35 15 32 15 28 C15 22 17 14 18 10 C18.5 8.5 17 7 16 7.5 C15 8 14 8 14 8Z" fill="#3b82f6"/>
        <path d="M22 5 C22 5 20 14 19.5 23 C19 30 21 37 24 40 C25 41 26.5 40.5 26.5 39 C26.5 37 24.5 33 24.5 28 C24.5 21 26 12 26.5 7 C26.8 5.5 25 4 24 4.5 C23 5 22 5 22 5Z" fill="#1a56db"/>
        <path d="M31 8 C31 8 33 16 34 24 C35 30 33 36 30 38 C29 38.5 28 38 28 37 C28 35 30 32 30 28 C30 22 28 14 27 10 C26.5 8.5 28 7 29 7.5 C30 8 31 8 31 8Z" fill="#60a5fa"/>
        <path d="M12 36 C12 36 16 39 24 39 C32 39 36 36 36 36 C36 38 34 42 24 42 C14 42 12 38 12 36Z" fill="#1e3a8a"/>
      </svg>
      <div class="wm text-base md:text-lg"><span class="t">Talon</span><span class="i">Insight</span></div>
    </a>
  `;

  const desktopNavLinks = buildDesktopNavLinks({ page });

  const desktopSearchHTML = page === 'analysis' ? `
    <div id="header-search-section" class="relative max-w-[320px] w-full max-md:hidden">
      <div class="flex items-center h-9 md:h-10 rounded-lg bg-[#f0f1f4] px-3 focus-within:ring-2 focus-within:ring-primary focus-within:bg-white transition-all">
        <span class="material-symbols-outlined text-[#636e88] text-lg mr-2">search</span>
        <input
          id="header-search-input"
          class="flex-1 bg-transparent border-none text-sm text-[#111318] placeholder:text-[#636e88] focus:outline-none focus:ring-0"
          placeholder="${t('header.search_placeholder')}"
          type="text"
        >
      </div>
      <div id="header-search-dropdown" class="hidden absolute top-[calc(100%+4px)] left-0 w-full overflow-hidden rounded-xl border border-[#dcdee5] bg-white shadow-2xl z-50">
        <div class="p-2">
          <div id="header-dropdown-items" class="flex flex-col max-h-[300px] overflow-y-auto"></div>
        </div>
      </div>
    </div>
  ` : '';

  const mobileDrawerContent = buildMobileDrawer({ page });

  return `
    <header class="sticky top-0 z-50 w-full bg-white border-b border-solid border-[#e5e7eb] px-4 sm:px-6 md:px-10 lg:px-20 xl:px-[100px] py-3">
      <div class="flex items-center justify-between gap-3 max-w-[1200px] mx-auto">
        ${logoHTML}
        <div class="flex flex-1 items-center justify-end gap-2 md:gap-3">
          ${desktopSearchHTML}
          <nav class="flex items-center gap-4 lg:gap-6 max-md:hidden">
            ${desktopNavLinks}
          </nav>
          ${buildLangSwitcher()}
          <!-- Auth area (filled by updateAuthUI) -->
          <div id="desktop-auth-area" class="max-md:hidden">
            <div class="w-[140px] h-9 rounded-lg bg-[#f0f1f4] animate-pulse"></div>
          </div>
          <!-- Hamburger (mobile) -->
          <button id="mobile-menu-btn" class="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[#f0f1f4] transition-colors" aria-label="${t('header.menu_open')}">
            <span class="material-symbols-outlined text-[#111318]">menu</span>
          </button>
        </div>
      </div>
    </header>

    <div id="mobile-menu-overlay" class="fixed inset-0 bg-black/40 z-[60] hidden opacity-0 transition-opacity duration-300 md:hidden"></div>

    <div id="mobile-menu-drawer" class="fixed top-0 right-0 h-full w-[85vw] max-w-[320px] bg-white z-[70] translate-x-full transition-transform duration-300 ease-in-out flex flex-col shadow-2xl md:hidden">
      ${mobileDrawerContent}
    </div>
  `;
}

// ─── Language switcher ────────────────────────────────────────────────────────

const LANG_OPTIONS = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  // { code: 'ja', label: '日本語' },  // uncomment when ready
];

function buildLangSwitcher() {
  const current = getLang();
  const currentLabel = LANG_OPTIONS.find(l => l.code === current)?.label ?? 'EN';

  const options = LANG_OPTIONS.map(l => `
    <button
      data-set-lang="${l.code}"
      class="flex items-center justify-between gap-2 w-full px-4 py-2.5 text-sm text-[#111318] hover:bg-[#f0f1f4] transition-colors ${l.code === current ? 'font-bold text-primary' : ''}"
    >
      ${l.label}
      ${l.code === current ? '<span class="material-symbols-outlined text-primary text-sm">check</span>' : ''}
    </button>
  `).join('');

  return `
    <div id="lang-menu-container" class="relative max-md:hidden">
      <button id="lang-toggle" class="flex items-center gap-1 h-9 px-2.5 rounded-lg hover:bg-[#f0f1f4] transition-colors text-xs font-medium text-[#636e88]">
        <span class="material-symbols-outlined text-base leading-none">language</span>
        <span>${currentLabel}</span>
        <span class="material-symbols-outlined text-sm leading-none">expand_more</span>
      </button>
      <div id="lang-dropdown" class="hidden absolute top-[calc(100%+8px)] right-0 bg-white rounded-xl border border-[#dcdee5] shadow-xl z-50 overflow-hidden min-w-[130px]">
        ${options}
      </div>
    </div>
  `;
}

function attachLangSwitcherHandlers() {
  const toggle   = document.getElementById('lang-toggle');
  const dropdown = document.getElementById('lang-dropdown');
  const container = document.getElementById('lang-menu-container');

  toggle?.addEventListener('click', () => dropdown?.classList.toggle('hidden'));

  document.addEventListener('click', (e) => {
    if (dropdown && container && !container.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-set-lang]');
    if (!btn) return;
    const lang = btn.dataset.setLang;
    setLang(lang);

    // Update desktop dropdown active states
    document.querySelectorAll('#lang-dropdown [data-set-lang]').forEach(b => {
      const isActive = b.dataset.setLang === lang;
      b.classList.toggle('font-bold', isActive);
      b.classList.toggle('text-primary', isActive);
      b.querySelector('.lang-check-icon')?.remove();
      if (isActive) {
        const check = document.createElement('span');
        check.className = 'material-symbols-outlined text-primary text-sm lang-check-icon';
        check.textContent = 'check';
        b.appendChild(check);
      }
    });

    // Update toggle button label
    const currentLabel = LANG_OPTIONS.find(l => l.code === lang)?.label;
    const toggle = document.getElementById('lang-toggle');
    if (toggle && currentLabel) {
      const labelSpan = toggle.querySelectorAll('span')[1];
      if (labelSpan) labelSpan.textContent = currentLabel;
    }

    // Update mobile switcher active states
    document.querySelectorAll('#mobile-menu-drawer [data-set-lang]').forEach(b => {
      const isActive = b.dataset.setLang === lang;
      b.classList.toggle('bg-primary', isActive);
      b.classList.toggle('text-white', isActive);
      b.classList.toggle('text-[#636e88]', !isActive);
      b.classList.toggle('hover:bg-[#f0f1f4]', !isActive);
    });

    // Close dropdown
    document.getElementById('lang-dropdown')?.classList.add('hidden');
  });
}

// ─── Desktop nav + Mobile drawer ─────────────────────────────────────────────

function buildDesktopNavLinks({ page }) {
  const base   = 'text-sm font-medium leading-normal transition-colors';
  const active = 'text-primary font-bold border-b-2 border-primary pb-0.5';
  const inact  = 'text-[#111318] hover:text-primary';

  return [
    `<a class="${base} ${page === 'services' ? active : inact}" href="/services/services" data-i18n="nav.services">${t('nav.services')}</a>`,
    `<a class="${base} ${page === 'pricing'  ? active : inact}" href="/payment/pricing" data-i18n="nav.pricing">${t('nav.pricing')}</a>`,
    `<a class="${base} ${page === 'blog'     ? active : inact}" href="/blog/blog" data-i18n="nav.blog">${t('nav.blog')}</a>`,
  ].join('');
}

function buildMobileDrawer({ page }) {
  const current = getLang();
  const drawerLogoHTML = `
    <div class="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
      <a href="https://taloninsight.com" class="flex items-center gap-2">
        <svg class="size-7" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 8 C14 8 11 16 10 24 C9 30 12 36 15 38 C16 38.5 17 38 17 37 C17 35 15 32 15 28 C15 22 17 14 18 10 C18.5 8.5 17 7 16 7.5 C15 8 14 8 14 8Z" fill="#3b82f6"/>
          <path d="M22 5 C22 5 20 14 19.5 23 C19 30 21 37 24 40 C25 41 26.5 40.5 26.5 39 C26.5 37 24.5 33 24.5 28 C24.5 21 26 12 26.5 7 C26.8 5.5 25 4 24 4.5 C23 5 22 5 22 5Z" fill="#1a56db"/>
          <path d="M31 8 C31 8 33 16 34 24 C35 30 33 36 30 38 C29 38.5 28 38 28 37 C28 35 30 32 30 28 C30 22 28 14 27 10 C26.5 8.5 28 7 29 7.5 C30 8 31 8 31 8Z" fill="#60a5fa"/>
          <path d="M12 36 C12 36 16 39 24 39 C32 39 36 36 36 36 C36 38 34 42 24 42 C14 42 12 38 12 36Z" fill="#1e3a8a"/>
        </svg>
        <div class="wm text-base"><span class="t">Talon</span><span class="i">Insight</span></div>
      </a>
      <button id="mobile-menu-close" class="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[#f0f1f4] transition-colors" aria-label="${t('header.menu_close')}">
        <span class="material-symbols-outlined text-[#111318]">close</span>
      </button>
    </div>
  `;

  const mobileSearchHTML = page === 'analysis' ? `
    <div class="px-5 py-4 border-b border-[#e5e7eb]">
      <p class="text-xs font-semibold text-[#636e88] mb-2 uppercase tracking-wider">${t('header.mobile_search_label')}</p>
      <div id="mobile-search-section" class="relative">
        <div class="flex items-center h-10 rounded-lg bg-[#f0f1f4] px-3 focus-within:ring-2 focus-within:ring-primary focus-within:bg-white transition-all">
          <span class="material-symbols-outlined text-[#636e88] text-lg mr-2">search</span>
          <input
            id="mobile-search-input"
            class="flex-1 bg-transparent border-none text-sm text-[#111318] placeholder:text-[#636e88] focus:outline-none focus:ring-0"
            placeholder="${t('header.mobile_search_placeholder')}"
            type="text"
          >
        </div>
        <div id="mobile-search-dropdown" class="hidden absolute top-[calc(100%+4px)] left-0 w-full overflow-hidden rounded-xl border border-[#dcdee5] bg-white shadow-2xl z-50">
          <div class="p-2">
            <div id="mobile-dropdown-items" class="flex flex-col max-h-[250px] overflow-y-auto"></div>
          </div>
        </div>
      </div>
    </div>
  ` : '';

  const mobileNavLinks = `
    <nav class="flex flex-col px-5 py-2 flex-1">
      <a href="/services/services" class="flex items-center gap-3 py-4 text-sm font-medium ${page === 'services' ? 'text-primary font-bold' : 'text-[#111318]'} border-b border-[#f0f1f4] hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-lg ${page === 'services' ? 'text-primary' : ''}">apps</span>
        <span data-i18n="nav.services">${t('nav.services')}</span>
      </a>
      <a href="/payment/pricing" class="flex items-center gap-3 py-4 text-sm font-medium ${page === 'pricing' ? 'text-primary font-bold' : 'text-[#111318]'} border-b border-[#f0f1f4] hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-lg ${page === 'pricing' ? 'text-primary' : ''}">credit_card</span>
        <span data-i18n="nav.pricing">${t('nav.pricing')}</span>
      </a>
      <a href="/blog/blog" class="flex items-center gap-3 py-4 text-sm font-medium ${page === 'blog' ? 'text-primary font-bold' : 'text-[#111318]'} border-b border-[#f0f1f4] hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-lg ${page === 'blog' ? 'text-primary' : ''}">article</span>
        <span data-i18n="nav.blog">${t('nav.blog')}</span>
      </a>
    </nav>
  `;

  // Mobile language switcher
  const mobileLangSwitcher = `
    <div class="px-5 py-3 border-t border-[#f0f1f4]">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-[#636e88] text-lg">language</span>
        <div class="flex items-center gap-1">
          ${LANG_OPTIONS.map(l => `
            <button
              data-set-lang="${l.code}"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${l.code === current ? 'bg-primary text-white' : 'text-[#636e88] hover:bg-[#f0f1f4]'}"
            >${l.label}</button>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  const mobileAuthPlaceholder = `<div id="mobile-auth-area"></div>`;

  return drawerLogoHTML + mobileSearchHTML + mobileNavLinks + mobileLangSwitcher + mobileAuthPlaceholder;
}

// ─── Mobile menu handlers ─────────────────────────────────────────────────────

function attachMobileMenuHandlers() {
  const mobileMenuBtn     = document.getElementById('mobile-menu-btn');
  const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
  const mobileMenuDrawer  = document.getElementById('mobile-menu-drawer');
  const mobileMenuClose   = document.getElementById('mobile-menu-close');

  function openMobileMenu() {
    mobileMenuOverlay.classList.remove('hidden');
    requestAnimationFrame(() => {
      mobileMenuOverlay.classList.remove('opacity-0');
      mobileMenuDrawer.classList.remove('translate-x-full');
    });
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    mobileMenuOverlay.classList.add('opacity-0');
    mobileMenuDrawer.classList.add('translate-x-full');
    setTimeout(() => mobileMenuOverlay.classList.add('hidden'), 300);
    document.body.style.overflow = '';
  }

  mobileMenuBtn?.addEventListener('click', openMobileMenu);
  mobileMenuClose?.addEventListener('click', closeMobileMenu);
  mobileMenuOverlay?.addEventListener('click', closeMobileMenu);
}

// ─── Analysis page header search ─────────────────────────────────────────────

function initHeaderSearch(apiBaseUrl) {
  let debounceTimer;

  const headerInput        = document.getElementById('header-search-input');
  const headerDropdown     = document.getElementById('header-search-dropdown');
  const headerDropdownItems = document.getElementById('header-dropdown-items');
  const headerSearchSection = document.getElementById('header-search-section');

  const mobileInput        = document.getElementById('mobile-search-input');
  const mobileDropdown     = document.getElementById('mobile-search-dropdown');
  const mobileDropdownItems = document.getElementById('mobile-dropdown-items');
  const mobileSearchSection = document.getElementById('mobile-search-section');

  function setupSearch(input, dropdown, dropdownItems, section) {
    if (!input) return;
    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => searchApps(e.target.value, dropdown, dropdownItems), 300);
    });

    document.addEventListener('click', (e) => {
      if (section && !e.target.closest(`#${section.id}`)) {
        dropdown.classList.add('hidden');
      }
    });

    input.addEventListener('focus', () => {
      if (input.value.trim().length >= 2 && dropdownItems.children.length > 0) {
        dropdown.classList.remove('hidden');
      }
    });
  }

  setupSearch(headerInput, headerDropdown, headerDropdownItems, headerSearchSection);
  setupSearch(mobileInput, mobileDropdown, mobileDropdownItems, mobileSearchSection);

  async function searchApps(query, dropdown, dropdownItems) {
    if (!query || query.trim().length < 2) {
      dropdown.classList.add('hidden');
      return;
    }

    dropdownItems.innerHTML = `
      <div class="flex items-center justify-center p-4 text-[#636e88]">
        <div class="w-4 h-4 border-2 border-gray-200 border-t-primary rounded-full animate-spin mr-2"></div>
        ${t('header.searching')}
      </div>
    `;
    dropdown.classList.remove('hidden');

    try {
      const [iTunesResults, playStoreResults] = await Promise.all([
        searchiTunes(query),
        searchPlayStore(apiBaseUrl, query),
      ]);
      const mergedResults = mergeSearchResults(iTunesResults, playStoreResults);
      renderDropdown(mergedResults, dropdown, dropdownItems);
    } catch (error) {
      console.error('Header search error:', error);
      dropdown.classList.add('hidden');
    }
  }

  async function searchiTunes(query) {
    try {
      const country = getMarket();
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=${country}&media=software&limit=10`
      );
      if (!response.ok) return [];
      const data = await response.json();
      return (data.results || []).map(app => ({
        appName:      app.trackName,
        appStoreUrl:  app.trackViewUrl,
        playStoreUrl: null,
        iconImageUrl: app.artworkUrl512 || app.artworkUrl100,
        developer:    app.artistName,
      }));
    } catch { return []; }
  }

  async function searchPlayStore(apiBaseUrl, query) {
    try {
      const country = getMarket();
      const response = await fetch(`${apiBaseUrl}/api/apps/search?query=${encodeURIComponent(query)}&country=${country}`);
      if (!response.ok) return [];
      return await response.json();
    } catch { return []; }
  }

  function mergeSearchResults(iTunesResults, playStoreResults) {
    const merged = [];
    const usedPlayStoreIndices = new Set();
    iTunesResults.forEach(iTunesApp => {
      const mergedApp = { ...iTunesApp };
      const matchIndex = playStoreResults.findIndex((playApp, idx) => {
        if (usedPlayStoreIndices.has(idx)) return false;
        const n1 = iTunesApp.appName.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
        const n2 = playApp.appName.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
        return n1 === n2 || n1.includes(n2) || n2.includes(n1);
      });
      if (matchIndex !== -1) {
        mergedApp.playStoreUrl = playStoreResults[matchIndex].playStoreUrl;
        usedPlayStoreIndices.add(matchIndex);
      }
      merged.push(mergedApp);
    });
    playStoreResults.forEach((playApp, idx) => {
      if (!usedPlayStoreIndices.has(idx)) merged.push({ ...playApp });
    });
    return merged.slice(0, 8);
  }

  function renderDropdown(results, dropdown, dropdownItems) {
    if (!results || results.length === 0) {
      dropdownItems.innerHTML = `<div class="flex items-center justify-center p-4 text-[#636e88] text-sm">${t('header.no_results')}</div>`;
      dropdown.classList.remove('hidden');
      return;
    }

    dropdownItems.innerHTML = results.map(app => `
      <div class="flex items-center gap-3 rounded-lg p-2.5 hover:bg-primary/5 cursor-pointer transition-colors" data-app='${JSON.stringify(app).replace(/'/g, "&apos;")}'>
        <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-10 shrink-0 border border-gray-100" style="background-image: url('${app.iconImageUrl}')"></div>
        <div class="flex-1 min-w-0">
          <p class="text-[#111318] text-sm font-bold truncate">${app.appName}</p>
          ${app.developer ? `<p class="text-[#636e88] text-xs truncate">${app.developer}</p>` : ''}
        </div>
      </div>
    `).join('');

    dropdown.classList.remove('hidden');

    dropdownItems.querySelectorAll('[data-app]').forEach(item => {
      item.addEventListener('click', () => {
        const app = JSON.parse(item.dataset.app.replace(/&apos;/g, "'"));
        const params = new URLSearchParams();
        if (app.appStoreUrl)  params.set('appStoreUrl', app.appStoreUrl);
        if (app.playStoreUrl) params.set('playStoreUrl', app.playStoreUrl);
        if (app.appName)      params.set('appName', app.appName);
        if (app.iconImageUrl) params.set('iconUrl', app.iconImageUrl);
        if (app.developer)    params.set('developer', app.developer);
        window.location.href = `/analysis/analysis.html?${params.toString()}`;
      });
    });
  }
}
