import { initSearchBar, onGroupAdd } from './components/search-bar.js';
import { initHeader } from './components/header.js';
import { initFooter } from './components/footer.js';
import { applyTranslations, t, getLang, getMarket } from './components/i18n.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';
const AB_TEXT = 'default_v1';

// ── Group Analysis State ─────────────────────────────────────────────────────
let selectedGroupApps = [];
let currentUser = null;

// 페이지 노출 이벤트 전송 (A/B 테스트 추적)
async function sendExposureEvent() {
  try {
    await fetch(`${API_BASE_URL}/api/events/exposure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abText: AB_TEXT })
    });
  } catch (error) {
    console.error('Exposure event error:', error);
  }
}

// Check if user is logged in
async function checkAuth() {
  const token = localStorage.getItem('auth_token');
  if (token) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      currentUser = data.user || null;
    } catch { /* ignore */ }
  }
}

// Set page title & meta description
const lang = getLang();
document.title = t('index.page_title');
const metaDesc = document.querySelector('meta[name="description"]');
if (metaDesc && lang === 'en') {
  metaDesc.content = 'Your data-driven app growth partner. Analyze competitor apps to uncover market opportunities.';
}

// Initialize app
async function initApp() {
  sendExposureEvent();
  await checkAuth();

  initHeader({ page: 'index', apiBaseUrl: API_BASE_URL });
  initFooter();
  initSearchBar(API_BASE_URL);
  applyTranslations();
  initGroupSetup();
}

initApp();

// ── Group Setup UI Logic ─────────────────────────────────────────────────────
function initGroupSetup() {
  const groupSection = document.getElementById('group-setup-section');
  const closeBtn = document.getElementById('close-group-setup');
  const startBtn = document.getElementById('index-start-group-btn');
  const groupNameInput = document.getElementById('index-group-name-input');

  // Register callback for when group add button is clicked in search results
  onGroupAdd((app) => {
    addAppToGroup(app);
    showGroupSetup();
  });

  // Close button
  closeBtn?.addEventListener('click', () => {
    groupSection?.classList.add('hidden');
  });

  // Group name input change
  groupNameInput?.addEventListener('input', updateStartButton);

  // Start button
  startBtn?.addEventListener('click', startGroupAnalysis);
}

function showGroupSetup() {
  const groupSection = document.getElementById('group-setup-section');
  const guestNotice = document.getElementById('index-guest-notice');

  groupSection?.classList.remove('hidden');

  // Show guest notice if not logged in
  if (!currentUser) {
    guestNotice?.classList.remove('hidden');
  } else {
    guestNotice?.classList.add('hidden');
  }
}

function addAppToGroup(app) {
  // Check if app already added
  if (selectedGroupApps.some(a => a.appName.toLowerCase() === app.appName.toLowerCase())) {
    return;
  }

  selectedGroupApps.push(app);
  renderSelectedApps();
  updateStartButton();
}

function removeAppFromGroup(index) {
  selectedGroupApps.splice(index, 1);
  renderSelectedApps();
  updateStartButton();

  // Hide group setup if no apps left
  if (selectedGroupApps.length === 0) {
    document.getElementById('group-setup-section')?.classList.add('hidden');
  }
}

function renderSelectedApps() {
  const container = document.getElementById('index-selected-apps');
  const badge = document.getElementById('index-app-count-badge');
  const placeholder = document.getElementById('index-empty-placeholder');

  if (!container) return;

  badge.textContent = getLang() === 'ko' ? `${selectedGroupApps.length}개 앱` : `${selectedGroupApps.length} apps`;

  if (selectedGroupApps.length === 0) {
    container.innerHTML = `
      <div id="index-empty-placeholder" class="w-full flex flex-col items-center justify-center py-2 gap-1 text-[#636e88]">
        <span class="material-symbols-outlined text-2xl text-[#e5e7eb]">add_circle</span>
        <p class="text-xs" data-i18n="index.group_empty_hint">${t('index.group_empty_hint')}</p>
      </div>`;
    container.className = 'flex flex-wrap gap-3 min-h-[80px] p-3 border-2 border-dashed border-[#e5e7eb] rounded-xl bg-[#f6f6f8] items-start content-start';
    return;
  }

  container.className = 'flex flex-wrap gap-3 min-h-[80px] p-3 border-2 border-primary/30 rounded-xl bg-primary/5 items-start content-start';
  container.innerHTML = selectedGroupApps.map((app, i) => {
    const iconHtml = app.iconUrl
      ? `<img src="${app.iconUrl}" alt="${app.appName}" class="w-12 h-12 rounded-xl object-cover">`
      : `<div class="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg">${(app.appName || '?')[0]}</div>`;

    return `
      <div class="flex flex-col items-center gap-1 relative animate-[popIn_0.2s_ease_both]">
        <div class="relative">
          ${iconHtml}
          <button
            class="remove-app-btn absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white border border-white flex items-center justify-center text-[10px] font-bold hover:scale-110 transition-transform leading-none"
            data-index="${i}"
          >×</button>
        </div>
        <p class="text-[10px] font-medium text-[#111318] text-center max-w-[56px] truncate">${app.appName}</p>
      </div>`;
  }).join('');

  // Add remove button listeners
  container.querySelectorAll('.remove-app-btn').forEach(btn => {
    btn.addEventListener('click', () => removeAppFromGroup(parseInt(btn.dataset.index)));
  });
}

function updateStartButton() {
  const startBtn = document.getElementById('index-start-group-btn');
  const groupNameInput = document.getElementById('index-group-name-input');
  const creditInfo = document.getElementById('index-credit-info');
  const guestNotice = document.getElementById('index-guest-notice');

  const groupName = groupNameInput?.value.trim() || '';
  const appCount = selectedGroupApps.length;
  const canStart = groupName.length > 0 && appCount >= 2;

  if (startBtn) {
    startBtn.disabled = !canStart;

    // Update button text to show what's missing
    const btnText = startBtn.querySelector('span[data-i18n]');
    if (btnText) {
      if (appCount < 2) {
        btnText.textContent = getLang() === 'ko' ? '앱 2개 이상 추가' : 'Add 2+ apps';
      } else if (!groupName) {
        btnText.textContent = getLang() === 'ko' ? '그룹명 입력 필요' : 'Enter group name';
      } else {
        btnText.textContent = t('group_page.start_analysis');
      }
    }
  }

  // Show/hide guest notice based on login status
  if (guestNotice) {
    if (!currentUser) {
      guestNotice.classList.remove('hidden');
    } else {
      guestNotice.classList.add('hidden');
    }
  }

  if (creditInfo) {
    if (appCount < 2) {
      creditInfo.textContent = t('index.group_credits_hint');
    } else if (!currentUser) {
      // Guest: free analysis
      creditInfo.innerHTML = getLang() === 'ko'
        ? `${appCount}개 앱 분석 · <span class="text-green-600 font-semibold">무료</span>`
        : `${appCount} apps · <span class="text-green-600 font-semibold">Free</span>`;
    } else {
      // Logged-in: credits = app count
      creditInfo.textContent = getLang() === 'ko'
        ? `${appCount}개 앱 분석 · ${appCount} 크레딧`
        : `${appCount} apps · ${appCount} credits`;
    }
  }
}

async function startGroupAnalysis() {
  const groupNameInput = document.getElementById('index-group-name-input');
  const groupName = groupNameInput?.value.trim() || '';

  if (selectedGroupApps.length < 2 || !groupName) return;

  const startBtn = document.getElementById('index-start-group-btn');

  // Disable button and show loading state
  if (startBtn) {
    startBtn.disabled = true;
    startBtn.innerHTML = `
      <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      <span>${getLang() === 'ko' ? '이동 중...' : 'Redirecting...'}</span>
    `;
  }

  // Store data in sessionStorage and redirect to group-analysis.html
  // This will show the full-screen progress view with app icons
  sessionStorage.setItem('pending_group_analysis', JSON.stringify({
    groupName,
    apps: selectedGroupApps,
  }));

  // Redirect to group-analysis.html which will auto-start the analysis
  window.location.href = '/analysis/group-analysis.html?fromIndex=true';
}


// Market selector tooltip
const marketSelect = document.getElementById('market-select');
const searchInput = document.getElementById('search-input');
const marketTooltip = document.getElementById('market-tooltip');
let tooltipTimer;

function showMarketTooltip() {
  if (!marketTooltip) return;
  marketTooltip.classList.remove('hidden');
  clearTimeout(tooltipTimer);
  tooltipTimer = setTimeout(() => marketTooltip.classList.add('hidden'), 3000);
}

if (marketSelect) marketSelect.addEventListener('click', showMarketTooltip);
if (searchInput) searchInput.addEventListener('focus', showMarketTooltip);
document.addEventListener('click', (e) => {
  if (marketTooltip && !marketSelect?.contains(e.target) && !searchInput?.contains(e.target)) {
    marketTooltip.classList.add('hidden');
  }
});
