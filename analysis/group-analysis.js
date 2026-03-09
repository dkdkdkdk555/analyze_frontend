import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { getLang, getMarket, setMarket, t, applyTranslations } from '../components/i18n.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';

// ── State ────────────────────────────────────────────────────────────────────
let selectedApps = []; // { appName, appStoreUrl, playStoreUrl, iconUrl }
let pendingApp = null;  // app pending confirmation in category modal
let currentUser = null;

// ── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  applyTranslations();
  document.title = t('group_page.page_title');
  await initHeader({ page: 'index', apiBaseUrl: API_BASE_URL });
  initFooter();

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

  if (!currentUser) {
    document.getElementById('login-required-notice').classList.remove('hidden');
    document.getElementById('start-btn').disabled = true;
  }

  setupEventListeners();

  // Pre-populate app from URL params (e.g., navigated from analysis.html)
  const params = new URLSearchParams(location.search);
  const preAppName = params.get('appName');
  if (preAppName) {
    const preApp = {
      appName: preAppName,
      appStoreUrl: params.get('appStoreUrl') || '',
      playStoreUrl: params.get('playStoreUrl') || '',
      iconUrl: params.get('iconUrl') || '',
    };
    doAddApp(preApp);
    // Focus the group name input
    document.getElementById('group-name-input').focus();
  }
}

// ── Event listeners ───────────────────────────────────────────────────────────
function setupEventListeners() {
  const groupNameInput = document.getElementById('group-name-input');
  const startBtn = document.getElementById('start-btn');
  const confirmAddBtn = document.getElementById('confirm-add-btn');
  const cancelAddBtn = document.getElementById('cancel-add-btn');
  const closeNoCreditsBtn = document.getElementById('close-no-credits-btn');
  const confirmStartBtn = document.getElementById('confirm-start-btn');
  const cancelStartBtn = document.getElementById('cancel-start-btn');

  groupNameInput.addEventListener('input', updateStartButton);

  startBtn.addEventListener('click', showConfirmStartModal);
  confirmStartBtn.addEventListener('click', () => {
    document.getElementById('confirm-start-modal').classList.add('hidden');
    startAnalysis();
  });
  cancelStartBtn.addEventListener('click', () => {
    document.getElementById('confirm-start-modal').classList.add('hidden');
  });

  confirmAddBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // 드롭다운이 닫히지 않도록
    document.getElementById('category-mismatch-modal').classList.add('hidden');
    if (pendingApp) {
      doAddApp(pendingApp);
      pendingApp = null;
    }
  });

  cancelAddBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // 드롭다운이 닫히지 않도록
    document.getElementById('category-mismatch-modal').classList.add('hidden');
    pendingApp = null;
    refreshGroupDropdown();
  });

  closeNoCreditsBtn.addEventListener('click', () => {
    document.getElementById('no-credits-modal').classList.add('hidden');
  });

  initGroupSearch();
}

// ── Group Search ──────────────────────────────────────────────────────────────
let groupSearchDebounceTimer;
let groupSearchAllResults = [];
let groupSearchExpanded = false;
const GROUP_SEARCH_INITIAL_LIMIT = 5;

function initGroupSearch() {
  const input = document.getElementById('app-search-input');
  const dropdownMore = document.getElementById('group-dropdown-more');
  const marketSelect = document.getElementById('group-market-select');

  if (marketSelect) {
    marketSelect.value = getMarket();
    marketSelect.addEventListener('change', (e) => setMarket(e.target.value));
  }

  input.addEventListener('input', (e) => {
    clearTimeout(groupSearchDebounceTimer);
    groupSearchDebounceTimer = setTimeout(() => runGroupSearch(e.target.value), 300);
  });

  dropdownMore?.addEventListener('click', (e) => {
    e.stopPropagation();
    groupSearchExpanded = !groupSearchExpanded;
    renderGroupDropdown(groupSearchAllResults);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#group-search-section')) {
      document.getElementById('group-search-dropdown')?.classList.add('hidden');
    }
  });
}

async function runGroupSearch(query) {
  if (!query || query.trim().length < 2) {
    document.getElementById('group-search-dropdown')?.classList.add('hidden');
    return;
  }
  groupSearchExpanded = false;
  showGroupSearchLoading();
  try {
    const [iTunesResults, playStoreResults] = await Promise.all([
      searchGroupiTunes(query),
      searchGroupPlayStore(query),
    ]);
    groupSearchAllResults = mergeGroupSearchResults(iTunesResults, playStoreResults);
    renderGroupDropdown(groupSearchAllResults);
  } catch {
    document.getElementById('group-search-dropdown')?.classList.add('hidden');
  }
}

function showGroupSearchLoading() {
  const items = document.getElementById('group-dropdown-items');
  const more = document.getElementById('group-dropdown-more');
  if (items) items.innerHTML = `
    <div class="flex items-center justify-center p-6 text-[#636e88]">
      <div class="w-5 h-5 border-2 border-gray-200 border-t-primary rounded-full animate-spin mr-2"></div>
      ${t('group_page.searching')}
    </div>`;
  if (more) more.classList.add('hidden');
  document.getElementById('group-search-dropdown')?.classList.remove('hidden');
}

async function searchGroupiTunes(query) {
  try {
    const country = getMarket();
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=${country}&media=software&limit=10`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(app => ({
      appName: app.trackName,
      appStoreUrl: app.trackViewUrl,
      playStoreUrl: null,
      iconImageUrl: app.artworkUrl512 || app.artworkUrl100,
      developer: app.artistName,
    }));
  } catch { return []; }
}

async function searchGroupPlayStore(query) {
  try {
    const country = getMarket();
    const res = await fetch(`${API_BASE_URL}/api/apps/search?query=${encodeURIComponent(query)}&country=${country}`);
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

function mergeGroupSearchResults(iTunesResults, playStoreResults) {
  const normalize = name => name
    .replace(/\s*\([^)]*\)/g, '')           // 괄호 부제목 제거
    .replace(/\s+[-:\/·]\s+.+$/, '')        // 대시·콜론 이후 부제목 제거
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '')
    .slice(0, 50);

  const getBigrams = str => {
    const s = new Set();
    for (let i = 0; i < str.length - 1; i++) s.add(str.slice(i, i + 2));
    return s;
  };

  // ── 최적화 1: Play Store 이름을 한 번만 정규화 ──────────────────────────────
  // 기존: normalize()가 iTunes 결과 수 × PlayStore 결과 수만큼 반복 호출
  // 개선: O(n+m) 으로 줄임
  const playEntries = playStoreResults.map(app => ({
    normalized: normalize(app.appName),
    bigrams: null, // ── 최적화 2: 바이그램은 lazy 생성 (substring 체크 실패 시에만)
  }));

  const isMatch = (n1, b1Ref, entry) => {
    const n2 = entry.normalized;
    if (n1 === n2) return true;
    const longer = n1.length >= n2.length ? n1 : n2;
    const shorter = n1.length >= n2.length ? n2 : n1;
    // 저비용 substring 체크 먼저 — 성공하면 Dice는 건너뜀
    if (shorter.length >= 2 && longer.includes(shorter) && shorter.length >= longer.length * 0.3) return true;
    // 고비용 Dice 유사도는 substring 실패 시에만, 바이그램도 그때 생성·캐싱
    if (shorter.length >= 3) {
      if (!b1Ref.val) b1Ref.val = getBigrams(n1);
      if (!entry.bigrams) entry.bigrams = getBigrams(n2);
      let intersection = 0;
      b1Ref.val.forEach(b => { if (entry.bigrams.has(b)) intersection++; });
      if ((2 * intersection) / (b1Ref.val.size + entry.bigrams.size) >= 0.6) return true;
    }
    return false;
  };

  const merged = [];
  const usedIndices = new Set();

  iTunesResults.forEach(iTunesApp => {
    const mergedApp = { ...iTunesApp };
    const n1 = normalize(iTunesApp.appName);
    const b1Ref = { val: null }; // 레퍼런스 객체로 캐싱 — 같은 iTunes 항목의 반복 매칭에서 재활용
    const matchIndex = playEntries.findIndex((entry, idx) => {
      if (usedIndices.has(idx)) return false;
      return isMatch(n1, b1Ref, entry);
    });
    if (matchIndex !== -1) {
      mergedApp.playStoreUrl = playStoreResults[matchIndex].playStoreUrl;
      if (!mergedApp.iconImageUrl && playStoreResults[matchIndex].iconImageUrl) {
        mergedApp.iconImageUrl = playStoreResults[matchIndex].iconImageUrl;
      }
      usedIndices.add(matchIndex);
    }
    merged.push(mergedApp);
  });

  playStoreResults.forEach((_, idx) => {
    if (!usedIndices.has(idx)) merged.push({ ...playStoreResults[idx] });
  });

  return merged.slice(0, 10);
}

function renderGroupDropdown(results) {
  const items = document.getElementById('group-dropdown-items');
  const more = document.getElementById('group-dropdown-more');
  const moreBtn = more?.querySelector('button');
  const dropdown = document.getElementById('group-search-dropdown');

  if (!results || !results.length) {
    if (items) items.innerHTML = `<div class="flex items-center justify-center p-6 text-[#636e88]">${t('group_page.no_results')}</div>`;
    more?.classList.add('hidden');
    dropdown?.classList.remove('hidden');
    return;
  }

  const displayResults = groupSearchExpanded ? results : results.slice(0, GROUP_SEARCH_INITIAL_LIMIT);
  const hasMore = results.length > GROUP_SEARCH_INITIAL_LIMIT;

  if (groupSearchExpanded && hasMore) {
    items.style.maxHeight = '320px';
    items.style.overflowY = 'auto';
  } else {
    items.style.maxHeight = '';
    items.style.overflowY = '';
  }

  const alreadyAdded = new Set(selectedApps.map(a => a.appName.toLowerCase()));

  items.innerHTML = displayResults.map(app => {
    const isAdded = alreadyAdded.has(app.appName.toLowerCase());
    const iconBg = app.iconImageUrl ? `url('${app.iconImageUrl}')` : 'none';
    return `
      <div class="flex items-center gap-3 rounded-lg p-3 ${isAdded ? 'opacity-50 cursor-default' : 'hover:bg-primary/5 cursor-pointer'} transition-colors group/item"
        data-app='${JSON.stringify(app).replace(/'/g, '&apos;')}'>
        <div class="shrink-0 rounded-xl bg-[#e5e7eb] bg-center bg-cover bg-no-repeat border border-gray-100"
          style="width:44px;height:44px;background-image:${iconBg}"></div>
        <div class="flex flex-1 flex-col text-left min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <p class="text-[#111318] text-sm font-bold leading-normal truncate">${app.appName}</p>
            ${app.playStoreUrl ? '<span class="rounded bg-green-100 px-1 py-0.5 text-[9px] font-bold text-green-700 shrink-0">PLAY</span>' : ''}
            ${app.appStoreUrl ? '<span class="rounded bg-blue-100 px-1 py-0.5 text-[9px] font-bold text-blue-700 shrink-0">iOS</span>' : ''}
          </div>
          ${app.developer ? `<p class="text-[#636e88] text-xs truncate">${app.developer}</p>` : ''}
        </div>
        ${isAdded
          ? `<span class="material-symbols-outlined text-green-500 shrink-0" style="font-size:20px">check_circle</span>`
          : `<span class="material-symbols-outlined text-primary shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity" style="font-size:20px">add_circle</span>`
        }
      </div>`;
  }).join('');

  if (more && moreBtn) {
    if (hasMore) {
      more.classList.remove('hidden');
      moreBtn.textContent = groupSearchExpanded
        ? t('group_page.collapse')
        : (getLang() === 'ko' ? `결과 더 보기 (+${results.length - GROUP_SEARCH_INITIAL_LIMIT}개)` : `Show more (+${results.length - GROUP_SEARCH_INITIAL_LIMIT})`);
    } else {
      more.classList.add('hidden');
    }
  }

  dropdown?.classList.remove('hidden');

  items.querySelectorAll('[data-app]').forEach(item => {
    const appData = JSON.parse(item.dataset.app.replace(/&apos;/g, "'"));
    if (alreadyAdded.has(appData.appName.toLowerCase())) return;
    item.addEventListener('click', (e) => {
      e.stopPropagation(); // 드롭다운이 document 외부클릭 핸들러에 의해 닫히지 않도록
      addApp({
        appName: appData.appName,
        appStoreUrl: appData.appStoreUrl || '',
        playStoreUrl: appData.playStoreUrl || '',
        iconUrl: appData.iconImageUrl || '',
      });
    });
  });
}

function refreshGroupDropdown() {
  if (groupSearchAllResults.length > 0) {
    document.getElementById('group-search-dropdown')?.classList.remove('hidden');
    renderGroupDropdown(groupSearchAllResults);
  }
}

// ── Add / Remove App ──────────────────────────────────────────────────────────
function addApp(app) {
  if (selectedApps.some(a => a.appName.toLowerCase() === app.appName.toLowerCase())) return;

  // Show category warning only when adding the second app
  if (selectedApps.length === 1) {
    pendingApp = app;
    document.getElementById('category-mismatch-modal').classList.remove('hidden');
    return;
  }

  doAddApp(app);
}

function doAddApp(app) {
  selectedApps.push(app);
  renderSelectedApps();
  updateCreditPreview();
  updateStartButton();
}

function removeApp(index) {
  selectedApps.splice(index, 1);
  renderSelectedApps();
  updateCreditPreview();
  updateStartButton();
}

function renderSelectedApps() {
  const container = document.getElementById('selected-apps');
  const badge = document.getElementById('app-count-badge');

  badge.textContent = getLang() === 'ko' ? `${selectedApps.length}개 앱` : `${selectedApps.length} apps`;

  if (!selectedApps.length) {
    container.innerHTML = `
      <div id="empty-placeholder" class="w-full flex flex-col items-center justify-center py-4 gap-2 text-[#636e88]">
        <span class="material-symbols-outlined text-4xl text-[#e5e7eb]">add_circle</span>
        <p class="text-sm">${t('group_page.empty_placeholder')}</p>
      </div>`;
    container.className = 'flex flex-wrap gap-4 min-h-[100px] p-4 border-2 border-dashed border-[#e5e7eb] rounded-xl bg-background-light items-start content-start';
    return;
  }

  container.className = 'flex flex-wrap gap-4 min-h-[100px] p-4 border-2 border-primary rounded-xl bg-white items-start content-start';
  container.innerHTML = selectedApps.map((app, i) => {
    const iconHtml = app.iconUrl
      ? `<img src="${app.iconUrl}" alt="${app.appName}" class="w-14 h-14 rounded-xl object-cover">`
      : `<div class="w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl">${(app.appName || '?')[0]}</div>`;

    return `
      <div class="flex flex-col items-center gap-1.5 relative animate-[popIn_0.2s_ease_both]">
        <div class="relative">
          ${iconHtml}
          <button
            class="remove-app-btn absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white border-2 border-white flex items-center justify-center text-xs font-bold hover:scale-110 transition-transform leading-none"
            data-index="${i}"
          >×</button>
        </div>
        <p class="text-xs font-medium text-[#111318] text-center max-w-[64px] truncate">${app.appName}</p>
      </div>`;
  }).join('');

  container.querySelectorAll('.remove-app-btn').forEach(btn => {
    btn.addEventListener('click', () => removeApp(parseInt(btn.dataset.index)));
  });

  // Re-render dropdown to reflect added/removed state
  refreshGroupDropdown();
}

// ── Credit Preview ────────────────────────────────────────────────────────────
function updateCreditPreview() {
  const n = selectedApps.length;
  const total = n + 1;
  const balance = currentUser?.credit_balance ?? 0;
  const breakdownEl = document.getElementById('credit-breakdown');
  const numEl = document.getElementById('credit-num');

  numEl.textContent = n < 2 ? '0' : String(total);

  if (n < 2) {
    breakdownEl.textContent = t('group_page.credits_hint_initial');
    return;
  }

  const afterBalance = balance - total;
  if (getLang() === 'ko') {
    breakdownEl.innerHTML = `
      앱 ${n}개 × 1 크레딧 = ${n} 크레딧<br>
      종합 분석 = 1 크레딧<br>
      <strong class="text-[#111318]">합계: ${total} 크레딧</strong>
      ${currentUser ? ` (잔여 ${balance} → 분석 후 ${afterBalance})` : ''}
    `;
  } else {
    breakdownEl.innerHTML = `
      ${n} apps × 1 credit = ${n} credits<br>
      Group analysis = 1 credit<br>
      <strong class="text-[#111318]">Total: ${total} credits</strong>
      ${currentUser ? ` (balance: ${balance} → ${afterBalance} after)` : ''}
    `;
  }

  if (currentUser && afterBalance < 0) {
    numEl.classList.add('text-red-500');
    numEl.classList.remove('text-primary');
  } else {
    numEl.classList.remove('text-red-500');
    numEl.classList.add('text-primary');
  }
}

// ── Start Button State ────────────────────────────────────────────────────────
function updateStartButton() {
  const startBtn = document.getElementById('start-btn');
  const groupName = document.getElementById('group-name-input').value.trim();
  const bottomInfo = document.getElementById('bottom-info');
  const n = selectedApps.length;

  // innerHTML을 항상 새로 쓰는 방식으로 통일 (이전에 innerHTML 교체 후 #bottom-app-count가 null이 되는 버그 수정)
  if (n >= 2) {
    bottomInfo.innerHTML = getLang() === 'ko'
      ? `앱 <strong class="text-[#111318]">${n}</strong>개 · <strong class="text-[#111318]">${n + 1}</strong> 크레딧 차감 예정`
      : `<strong class="text-[#111318]">${n}</strong> apps · <strong class="text-[#111318]">${n + 1}</strong> credits to be used`;
  } else {
    bottomInfo.innerHTML = getLang() === 'ko'
      ? `앱 <strong class="text-[#111318]">${n}</strong>개 선택됨`
      : `<strong class="text-[#111318]">${n}</strong> apps selected`;
  }

  const canStart = groupName.length > 0 && n >= 2 && currentUser;
  startBtn.disabled = !canStart;
}

// ── Confirm Start Modal ───────────────────────────────────────────────────────
function showConfirmStartModal() {
  const groupName = document.getElementById('group-name-input').value.trim();
  const n = selectedApps.length;
  const creditRequired = n + 1;
  const balance = currentUser?.credit_balance ?? 0;

  if ((balance) < creditRequired) {
    document.getElementById('no-credits-detail').innerHTML = getLang() === 'ko'
      ? `그룹 분석에 <strong>${creditRequired} 크레딧</strong>이 필요하지만<br>현재 <strong>${balance} 크레딧</strong>만 남아있어요.`
      : `Group analysis requires <strong>${creditRequired} credits</strong>,<br>but you only have <strong>${balance} credits</strong>.`;
    document.getElementById('no-credits-modal').classList.remove('hidden');
    return;
  }

  document.getElementById('confirm-start-detail').innerHTML = getLang() === 'ko'
    ? `<strong>${groupName}</strong> 그룹의 앱 ${n}개를 분석해요.<br><strong class="text-[#111318]">${creditRequired} 크레딧</strong>이 차감됩니다.`
    : `Analyzing <strong>${n}</strong> apps in the <strong>${groupName}</strong> group.<br><strong class="text-[#111318]">${creditRequired} credits</strong> will be used.`;
  document.getElementById('confirm-start-modal').classList.remove('hidden');
}

// ── Start Analysis ─────────────────────────────────────────────────────────────
async function startAnalysis() {
  const groupName = document.getElementById('group-name-input').value.trim();
  const token = localStorage.getItem('auth_token');

  if (!token || !currentUser) return;

  // Show progress view
  document.getElementById('creation-view').classList.add('hidden');
  document.getElementById('progress-view').classList.remove('hidden');

  buildProgressGrid();
  updateProgressBar(5);

  try {
    const res = await fetch(`${API_BASE_URL}/api/groups/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ groupName, apps: selectedApps, lang: getLang(), market: getMarket() }),
    });

    if (res.status === 402) {
      showError(t('group_page.err_no_credits'));
      return;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showError(err.error || t('group_page.err_start_failed'));
      return;
    }

    // SSE stream
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let doneCount = 0;
    const totalApps = selectedApps.length;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const chunk of lines) {
        const dataLine = chunk.split('\n').find(l => l.startsWith('data: '));
        if (!dataLine) continue;

        let event;
        try {
          event = JSON.parse(dataLine.slice(6));
        } catch { continue; }

        switch (event.type) {
          case 'app_start':
            setAppStatus(event.appIndex, 'loading');
            break;

          case 'app_done':
            doneCount++;
            setAppStatus(event.appIndex, 'done');
            updateProgressBar(Math.round(10 + (doneCount / totalApps) * 60));
            break;

          case 'app_error':
            setAppStatus(event.appIndex, 'error');
            doneCount++;
            break;

          case 'group_start':
            document.getElementById('group-progress').classList.remove('hidden');
            updateProgressBar(75);
            break;

          case 'group_done':
            updateProgressBar(100);
            setTimeout(() => {
              location.href = `/analysis/group-analysis-result.html?id=${event.groupAnalysisId}`;
            }, 500);
            break;

          case 'error':
            showError(event.message || t('group_page.err_progress'));
            break;
        }
      }
    }
  } catch (err) {
    showError(t('group_page.err_network'));
  }
}

// ── Progress UI ───────────────────────────────────────────────────────────────
function buildProgressGrid() {
  const grid = document.getElementById('app-progress-grid');
  grid.innerHTML = selectedApps.map((app, i) => {
    const iconHtml = app.iconUrl
      ? `<img src="${app.iconUrl}" alt="${app.appName}" class="w-16 h-16 rounded-2xl object-cover">`
      : `<div class="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-2xl">${(app.appName || '?')[0]}</div>`;

    return `
      <div class="flex flex-col items-center gap-2" id="app-progress-${i}">
        <div class="relative w-16 h-16">
          <div class="app-icon-wrap opacity-40" style="filter:blur(2px)">
            ${iconHtml}
          </div>
          <div class="spinner-layer absolute inset-0 flex items-center justify-center">
            <div class="w-7 h-7 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
          <div class="check-layer hidden absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <span class="text-white text-xs">✓</span>
          </div>
          <div class="error-layer hidden absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
            <span class="text-white text-xs">✕</span>
          </div>
        </div>
        <p class="text-xs font-medium text-[#111318] text-center max-w-[72px] truncate">${app.appName}</p>
        <p class="app-status text-xs text-[#636e88]">${t('group_page.waiting')}</p>
      </div>`;
  }).join('');
}

function setAppStatus(index, status) {
  const el = document.getElementById(`app-progress-${index}`);
  if (!el) return;
  const icon = el.querySelector('.app-icon-wrap');
  const spinner = el.querySelector('.spinner-layer');
  const check = el.querySelector('.check-layer');
  const errorLayer = el.querySelector('.error-layer');
  const statusText = el.querySelector('.app-status');

  if (status === 'loading') {
    icon.style.filter = 'blur(2px)';
    icon.style.opacity = '0.5';
    spinner.classList.remove('hidden');
    statusText.textContent = t('group_page.analyzing');
  } else if (status === 'done') {
    icon.style.filter = 'none';
    icon.style.opacity = '1';
    spinner.classList.add('hidden');
    check.classList.remove('hidden');
    statusText.textContent = t('group_page.done');
    statusText.classList.add('text-green-500');
  } else if (status === 'error') {
    icon.style.filter = 'none';
    icon.style.opacity = '0.5';
    spinner.classList.add('hidden');
    errorLayer.classList.remove('hidden');
    statusText.textContent = t('group_page.failed');
    statusText.classList.add('text-red-400');
  }
}

function updateProgressBar(pct) {
  const bar = document.getElementById('progress-bar');
  if (bar) bar.style.width = `${pct}%`;
}

function showError(message) {
  document.getElementById('progress-view').innerHTML = `
    <div class="flex flex-col items-center gap-4 text-center p-8">
      <span class="material-symbols-outlined text-5xl text-red-400">error</span>
      <p class="text-base font-semibold text-[#111318]">${t('group_page.error_title')}</p>
      <p class="text-sm text-[#636e88]">${message}</p>
      <button onclick="location.href='/analysis/group-analysis.html'" class="mt-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors">
        ${t('group_page.retry')}
      </button>
    </div>`;
}

init();
