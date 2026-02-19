import { renderRatingChart } from './components/rating-chart.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';
const params = new URLSearchParams(window.location.search);
const appStoreUrl = params.get('appStoreUrl');
const playStoreUrl = params.get('playStoreUrl');
// 검색 시 가져온 메타데이터 (백엔드 fallback용)
const appName = params.get('appName');
const iconUrl = params.get('iconUrl');
const developer = params.get('developer');

// A/B 테스트 텍스트 (추후 변형 테스트 시 사용)
const AB_TEXT = 'default_v1';

let analysisData = null;
let feedbackSubmitted = false;
let selectedFeedback = null;
let headerDebounceTimer;
let selectedHeaderApp = null;
let loadingMessageInterval = null;
let exposureSent = false;
let userHasEmail = false; // Flag to track if user already submitted email
let loadingStartTime = null; // Track when loading started
let pendingAnalysisData = null; // Store analysis result while waiting for minimum loading time

// Minimum loading time: 21 seconds (7 seconds × 3 messages) to show video ad
const MIN_LOADING_TIME_MS = 21000;
const LOADING_MESSAGE_INTERVAL_MS = 7000;

const loadingMessages = [
  '스토어 등록정보를 분석 중 입니다..',
  '각 스토어의 리뷰를 분석 중 입니다..',
  '웹서치하여 정성데이터를 분석 중 입니다..'
];
let currentLoadingMessageIndex = 0;

// 페이지 노출 이벤트 전송 (A/B 테스트 추적)
async function sendExposureEvent() {
  if (exposureSent) return;

  try {
    await fetch(`${API_BASE_URL}/api/events/exposure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abText: AB_TEXT })
    });
    exposureSent = true;
  } catch (error) {
    console.error('Exposure event error:', error);
  }
}

// 사용자 상태 확인 (이메일 제출 여부)
async function checkUserStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/status`);
    if (response.ok) {
      const data = await response.json();
      userHasEmail = data.hasEmail || false;
    }
  } catch (error) {
    console.error('User status check error:', error);
  }
}

async function analyzeApp() {
  showLoading();
  loadingStartTime = Date.now();

  try {
    const response = await fetch(`${API_BASE_URL}/api/apps/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appStoreUrl,
        playStoreUrl,
        abText: AB_TEXT,
        // 메타데이터 전달 (iTunes API 실패 시 fallback)
        metadata: appName ? { appName, iconUrl, developer } : undefined
      })
    });

    if (response.status === 429) {
      // For rate limit, wait for minimum loading time before showing
      await waitForMinLoadingTime();
      showLimited();
      return;
    }

    if (!response.ok) {
      await waitForMinLoadingTime();
      showError();
      return;
    }

    pendingAnalysisData = await response.json();

    // Wait for minimum loading time to show video ad
    await waitForMinLoadingTime();

    analysisData = pendingAnalysisData;
    renderResults(analysisData);
  } catch (error) {
    console.error('Analysis error:', error);
    await waitForMinLoadingTime();
    showError();
  }
}

// Wait until minimum loading time has elapsed
async function waitForMinLoadingTime() {
  const elapsed = Date.now() - loadingStartTime;
  const remaining = MIN_LOADING_TIME_MS - elapsed;

  if (remaining > 0) {
    await new Promise(resolve => setTimeout(resolve, remaining));
  }
}

function renderResults(data) {
  stopLoading();
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('results').classList.remove('hidden');

  // Set cached indicator
  const isCachedInput = document.getElementById('is-cached-result');
  if (isCachedInput) {
    isCachedInput.value = data.isCached ? 'true' : 'false';
  }

  // Show reuse-why popup on second analysis
  if (data.analysisCount === 2) {
    showReuseWhyPopup();
  }

  // App Header
  document.getElementById('app-icon').src = data.appIconUrl || '';
  document.getElementById('app-name').textContent = data.appName || '';
  document.getElementById('breadcrumb-app-name').textContent = `앱 분석: ${data.appName || ''}`;
  document.getElementById('app-meta').textContent = `분석 완료 | ${new Date().toLocaleDateString('ko-KR')}`;

  // Store links
  const appStoreLinkEl = document.getElementById('app-store-link');
  const playStoreLinkEl = document.getElementById('play-store-link');
  if (appStoreUrl) {
    appStoreLinkEl.href = appStoreUrl;
    appStoreLinkEl.classList.remove('hidden');
    appStoreLinkEl.classList.add('inline-flex');
  }
  if (playStoreUrl) {
    playStoreLinkEl.href = playStoreUrl;
    playStoreLinkEl.classList.remove('hidden');
    playStoreLinkEl.classList.add('inline-flex');
  }

  // 01. Market Definition
  const tam = data.market?.definition?.tam;
  const sam = data.market?.definition?.sam;
  document.getElementById('tam-value').textContent = tam?.size || 'N/A';
  document.getElementById('tam-description').textContent = tam?.description || '';
  document.getElementById('sam-value').textContent = sam?.size || 'N/A';
  document.getElementById('sam-description').textContent = sam?.description || '';

  // 02. Core Value
  document.getElementById('core-value-statement').textContent = data.coreValue?.statement || '';
  document.getElementById('core-value-detail').textContent = data.coreValue?.detail || '';

  // 03. Core Features
  const features = data.coreFeatures || [];
  const featureIcons = ['send_money', 'show_chart', 'account_balance_wallet', 'card_giftcard', 'star'];
  document.getElementById('core-features-list').innerHTML = features.map((f, i) => {
    const badgeClass = getBadgeClass(f.recognizedByUsers);
    return `
      <li class="p-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-primary">${featureIcons[i % featureIcons.length]}</span>
          <span class="font-medium text-sm md:text-base">${f.feature}</span>
        </div>
        <span class="px-2 md:px-3 py-1 ${badgeClass} rounded-full text-[10px] md:text-xs font-bold uppercase">${f.recognizedByUsers}</span>
      </li>
    `;
  }).join('');

  // 04. Unresolved Problems
  const problems = data.unresolvedProblems || [];
  document.getElementById('unresolved-problems-grid').innerHTML = problems.map(p => {
    const strengthClass = getStrengthClass(p.signalStrength);
    const bars = getSignalBars(p.signalStrength);
    return `
      <div class="p-3 md:p-4 border border-[#dcdee5] bg-white rounded-xl flex flex-col gap-2 md:gap-3">
        <div class="flex justify-between">
          <span class="material-symbols-outlined ${strengthClass.icon}">${strengthClass.iconName}</span>
          <div class="flex gap-0.5">
            ${bars}
          </div>
        </div>
        <p class="font-bold text-xs md:text-sm">${p.problem}</p>
        <p class="text-[10px] md:text-xs text-gray-500">${p.description}</p>
        <span class="text-[10px] font-bold ${strengthClass.badge} px-1.5 py-0.5 self-start rounded">${p.signalStrength?.toUpperCase() || 'N/A'}</span>
      </div>
    `;
  }).join('');

  // 05. Ratings
  if (data.ratings?.distribution) {
    renderRatingsSection(data.ratings);
  }

  // 06. Reviews by Rating
  const reviews = data.reviewsByRating || {};
  document.getElementById('reviews-list').innerHTML = Object.entries(reviews)
    .sort(([a], [b]) => parseInt(b) - parseInt(a))
    .map(([rating, review]) => {
      const stars = renderStars(parseInt(rating));
      const label = parseInt(rating) >= 4 ? '긍정' : parseInt(rating) >= 3 ? '중립' : '부정';
      return `
        <div class="p-3 md:p-4">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            ${stars}
            <span class="text-[10px] md:text-xs font-bold ml-1 md:ml-2">${rating}점 (${label})</span>
          </div>
          <p class="text-xs md:text-sm text-[#636e88] mb-2">${review.summary || ''}</p>
          ${review.keywords?.length ? `
            <div class="flex flex-wrap gap-1">
              ${review.keywords.map(k => `<span class="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">${k}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

  // 07. Complaints
  const complaints = data.complaints || {};
  renderComplaintList('complaints-uiux-list', complaints.uiUx);
  renderComplaintList('complaints-performance-list', complaints.performance);
  renderComplaintList('complaints-stability-list', complaints.stability);

  // 08. Strategy Suggestion
  document.getElementById('strategy-oneline').textContent = data.strategySuggestion?.oneLine || '';
  document.getElementById('strategy-reasoning').textContent = data.strategySuggestion?.reasoning || '';

  // Scroll detection for email popup
  let emailPopupShown = false;
  window.addEventListener('scroll', () => {
    if (!emailPopupShown && (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
      emailPopupShown = true;
      showEmailPopup();
    }
  });
}

function getBadgeClass(recognition) {
  if (!recognition) return 'bg-gray-100 text-gray-700';
  const lower = recognition.toLowerCase();
  if (lower.includes('positive') || lower.includes('긍정')) {
    return 'bg-green-100 text-green-700';
  } else if (lower.includes('negative') || lower.includes('부정')) {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-gray-100 text-gray-700';
}

function getStrengthClass(strength) {
  if (!strength) return { icon: 'text-gray-400', iconName: 'info', badge: 'text-gray-600 bg-gray-50' };
  const lower = strength.toLowerCase();
  if (lower === 'strong' || lower === '강함') {
    return { icon: 'text-red-500', iconName: 'warning', badge: 'text-red-600 bg-red-50' };
  } else if (lower === 'medium' || lower === '중간') {
    return { icon: 'text-orange-500', iconName: 'info', badge: 'text-orange-600 bg-orange-50' };
  }
  return { icon: 'text-gray-400', iconName: 'info', badge: 'text-gray-600 bg-gray-50' };
}

function getSignalBars(strength) {
  const lower = (strength || '').toLowerCase();
  let activeBars = 1;
  let colorClass = 'bg-gray-200';

  if (lower === 'strong' || lower === '강함') {
    activeBars = 3;
    colorClass = 'bg-red-500';
  } else if (lower === 'medium' || lower === '중간') {
    activeBars = 2;
    colorClass = 'bg-orange-500';
  }

  return [1, 2, 3].map(i =>
    `<div class="w-1 h-3 rounded-full ${i <= activeBars ? colorClass : 'bg-gray-200'}"></div>`
  ).join('');
}

function renderStars(rating) {
  const filled = Math.min(5, Math.max(0, rating));
  const starColor = rating >= 4 ? 'text-yellow-400' : rating >= 3 ? 'text-yellow-400' : 'text-red-400';
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= filled) {
      stars += `<span class="material-symbols-outlined text-sm md:text-base ${starColor}" style="font-variation-settings: 'FILL' 1">star</span>`;
    } else {
      stars += `<span class="material-symbols-outlined text-sm md:text-base text-gray-200">star</span>`;
    }
  }
  return stars;
}

function renderRatingsSection(ratings) {
  const distribution = ratings.distribution || {};
  const total = Object.values(distribution).reduce((a, b) => a + b, 0) || 1;
  const avg = Object.entries(distribution).reduce((acc, [star, count]) => acc + (parseInt(star) * count), 0) / total;

  document.getElementById('overall-rating').textContent = avg.toFixed(1);

  // Pie chart
  const colors = ['#1d5ae7', '#4b7bee', '#94b2f4', '#c7d7fa', '#e0e7ff'];
  let cumulativePercent = 0;
  const gradientParts = [];

  [5, 4, 3, 2, 1].forEach((star, idx) => {
    const count = distribution[star] || 0;
    const percent = (count / total) * 100;
    gradientParts.push(`${colors[idx]} ${cumulativePercent}% ${cumulativePercent + percent}%`);
    cumulativePercent += percent;
  });

  document.getElementById('ratings-pie').style.background = `conic-gradient(${gradientParts.join(', ')})`;

  // Legend
  document.getElementById('ratings-legend').innerHTML = [5, 4, 3, 2, 1].map((star, idx) => {
    const count = distribution[star] || 0;
    const percent = ((count / total) * 100).toFixed(0);
    return `
      <div class="flex items-center justify-between text-[10px] md:text-xs">
        <span class="flex items-center gap-1.5 md:gap-2"><div class="w-2 h-2 rounded-full" style="background: ${colors[idx]}"></div> ${star}점</span>
        <span class="font-bold">${percent}%</span>
      </div>
    `;
  }).join('');
}

function renderComplaintList(elementId, complaint) {
  const list = document.getElementById(elementId);
  if (!list || !complaint) return;

  const items = complaint.description ? [complaint.description] : [];
  if (complaint.items) items.push(...complaint.items);

  list.innerHTML = items.slice(0, 3).map(item => `
    <li class="flex gap-2">
      <div class="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
      <p class="text-xs md:text-sm">${item}</p>
    </li>
  `).join('') || '<li class="text-xs md:text-sm text-gray-400">데이터 없음</li>';
}

function showLoading() {
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('error').classList.add('hidden');
  document.getElementById('limited').classList.add('hidden');
  document.getElementById('results').classList.add('hidden');
  startLoadingMessages();
}

function stopLoading() {
  if (loadingMessageInterval) {
    clearInterval(loadingMessageInterval);
    loadingMessageInterval = null;
  }
  currentLoadingMessageIndex = 0;
}

function startLoadingMessages() {
  const loadingText = document.getElementById('loading-text');
  if (!loadingText) return;

  currentLoadingMessageIndex = 0;
  loadingText.textContent = loadingMessages[0];
  loadingText.style.opacity = '1';

  loadingMessageInterval = setInterval(() => {
    // Fade out
    loadingText.style.opacity = '0';

    setTimeout(() => {
      // Cycle through messages continuously
      currentLoadingMessageIndex = (currentLoadingMessageIndex + 1) % loadingMessages.length;
      loadingText.textContent = loadingMessages[currentLoadingMessageIndex];
      loadingText.style.opacity = '1';
    }, 500);
  }, LOADING_MESSAGE_INTERVAL_MS);
}

function showError() {
  stopLoading();
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('error').classList.remove('hidden');
}

function showLimited() {
  stopLoading();
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('limited').classList.remove('hidden');
  showEmailPopup();
}

function showEmailPopup() {
  // Don't show popup if user already submitted email
  if (userHasEmail) return;
  // Reset to step 1
  document.getElementById('email-popup-step1')?.classList.remove('hidden');
  document.getElementById('email-popup-step2')?.classList.add('hidden');
  document.getElementById('email-popup').classList.remove('hidden');
}

function hideEmailPopup() {
  document.getElementById('email-popup').classList.add('hidden');
}

async function submitFeedback(usePurpose) {
  const curiousContent = document.getElementById('curious-content').value;

  try {
    await fetch(`${API_BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usePurpose, curiousContent })
    });

    feedbackSubmitted = true;
    const feedbackSection = document.querySelector('.user-feedback');
    feedbackSection.innerHTML = '<p class="text-center py-8 text-[#636e88] font-medium">피드백 감사합니다!</p>';
  } catch (error) {
    console.error('Feedback error:', error);
  }
}

async function submitEmail() {
  const email = document.getElementById('email-input').value;

  if (!email || !email.includes('@')) {
    alert('유효한 이메일을 입력해주세요');
    return;
  }

  try {
    await fetch(`${API_BASE_URL}/api/notifications/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    userHasEmail = true; // Prevent popup from showing again

    // Show step 2 instead of closing
    document.getElementById('email-popup-step1').classList.add('hidden');
    document.getElementById('email-popup-step2').classList.remove('hidden');
  } catch (error) {
    console.error('Email signup error:', error);
    alert('오류가 발생했습니다. 다시 시도해주세요.');
  }
}

async function submitEmailRegistWhy(stage) {
  try {
    await fetch(`${API_BASE_URL}/api/email-regist-why`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailRegistWhy: stage })
    });
  } catch (error) {
    console.error('EmailRegistWhy error:', error);
  } finally {
    hideEmailPopup();
  }
}

// Event listeners
document.getElementById('retry-btn')?.addEventListener('click', analyzeApp);

// Survey option click handlers
let selectedSurvey = null;

document.querySelectorAll('.survey-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.survey-btn').forEach(b => {
      b.classList.remove('border-primary', 'text-primary', 'bg-primary/5');
    });
    btn.classList.add('border-primary', 'text-primary', 'bg-primary/5');

    const value = btn.dataset.value;
    const otherInput = document.getElementById('survey-other-input');
    const submitBtn = document.getElementById('submit-feedback');

    if (value === '기타') {
      otherInput.classList.remove('hidden');
      selectedSurvey = null;
      submitBtn.disabled = true;
    } else {
      otherInput.classList.add('hidden');
      selectedSurvey = value;
      submitBtn.disabled = false;
    }
  });
});

document.getElementById('survey-other-text')?.addEventListener('input', (e) => {
  const val = e.target.value.trim();
  selectedSurvey = val || null;
  document.getElementById('submit-feedback').disabled = !val;
});

document.getElementById('submit-feedback')?.addEventListener('click', () => {
  if (selectedSurvey) {
    submitFeedback(selectedSurvey);
  }
});

document.getElementById('submit-email')?.addEventListener('click', submitEmail);

// Reuse Why popup
let selectedReuseWhy = null;

function showReuseWhyPopup() {
  // Reset state
  selectedReuseWhy = null;
  document.querySelectorAll('.reuse-why-btn').forEach(b => {
    b.classList.remove('border-primary', 'text-primary', 'bg-primary/5');
  });
  document.getElementById('reuse-why-other-input')?.classList.add('hidden');
  const submitBtn = document.getElementById('submit-reuse-why');
  if (submitBtn) submitBtn.disabled = true;

  document.getElementById('reuse-why-popup')?.classList.remove('hidden');
}

function hideReuseWhyPopup() {
  document.getElementById('reuse-why-popup')?.classList.add('hidden');
}

async function submitReuseWhy() {
  if (!selectedReuseWhy) {
    hideReuseWhyPopup();
    return;
  }
  try {
    await fetch(`${API_BASE_URL}/api/reuse-why`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reuseWhy: selectedReuseWhy })
    });
  } catch (error) {
    console.error('ReuseWhy error:', error);
  } finally {
    hideReuseWhyPopup();
  }
}

document.querySelectorAll('.reuse-why-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.reuse-why-btn').forEach(b => {
      b.classList.remove('border-primary', 'text-primary', 'bg-primary/5');
    });
    btn.classList.add('border-primary', 'text-primary', 'bg-primary/5');

    const value = btn.dataset.value;
    const otherInput = document.getElementById('reuse-why-other-input');
    const submitBtn = document.getElementById('submit-reuse-why');

    if (value === '기타') {
      otherInput?.classList.remove('hidden');
      selectedReuseWhy = null;
      if (submitBtn) submitBtn.disabled = true;
    } else {
      otherInput?.classList.add('hidden');
      selectedReuseWhy = value;
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});

document.getElementById('reuse-why-other-text')?.addEventListener('input', (e) => {
  const val = e.target.value.trim();
  selectedReuseWhy = val || null;
  const submitBtn = document.getElementById('submit-reuse-why');
  if (submitBtn) submitBtn.disabled = !val;
});

document.getElementById('close-reuse-popup')?.addEventListener('click', hideReuseWhyPopup);
document.getElementById('submit-reuse-why')?.addEventListener('click', submitReuseWhy);
document.getElementById('close-popup')?.addEventListener('click', hideEmailPopup);
document.getElementById('email-signup-btn')?.addEventListener('click', showEmailPopup);

// Stage buttons (email step 2)
document.querySelectorAll('.stage-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    submitEmailRegistWhy(btn.dataset.value);
  });
});
document.getElementById('skip-stage')?.addEventListener('click', hideEmailPopup);

// PDF Download functionality
document.getElementById('download-pdf-btn')?.addEventListener('click', downloadAsPDF);

// Header search functionality
initHeaderSearch();

// Mobile menu
initMobileMenu();

// Initialize page (async to ensure user status is checked first)
(async function init() {
  // Check user status first (wait for completion to know if email popup should show)
  await checkUserStatus();

  // Send exposure event on page load
  sendExposureEvent();

  // Start analysis
  analyzeApp();
})();

// Initialize header search
function initHeaderSearch() {
  const input = document.getElementById('header-search-input');
  const dropdown = document.getElementById('header-search-dropdown');

  if (!input || !dropdown) return;

  input.addEventListener('input', (e) => {
    clearTimeout(headerDebounceTimer);
    headerDebounceTimer = setTimeout(() => searchHeaderApps(e.target.value), 300);
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#header-search-section')) {
      dropdown.classList.add('hidden');
    }
  });
}

async function searchHeaderApps(query) {
  const dropdown = document.getElementById('header-search-dropdown');

  if (!query || query.trim().length < 2) {
    dropdown.classList.add('hidden');
    return;
  }

  try {
    // 로딩 표시
    showHeaderLoadingDropdown();

    // 병렬로 iTunes API와 백엔드 Play Store 검색 실행
    const [iTunesResults, playStoreResults] = await Promise.all([
      searchHeaderiTunes(query),
      searchHeaderPlayStore(query),
    ]);

    // 결과 병합 (개선된 매칭 로직)
    const mergedResults = mergeHeaderResults(iTunesResults, playStoreResults);
    renderHeaderDropdown(mergedResults);
  } catch (error) {
    console.error('Header search error:', error);
    dropdown.classList.add('hidden');
  }
}

function showHeaderLoadingDropdown() {
  const dropdown = document.getElementById('header-search-dropdown');
  const dropdownItems = document.getElementById('header-dropdown-items');
  dropdownItems.innerHTML = `
    <div class="flex items-center justify-center p-4 text-[#636e88] text-sm">
      <div class="w-4 h-4 border-2 border-gray-200 border-t-primary rounded-full animate-spin mr-2"></div>
      검색 중...
    </div>
  `;
  dropdown.classList.remove('hidden');
}

// iTunes Search API 직접 호출
async function searchHeaderiTunes(query) {
  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=kr&media=software&limit=10`
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.results || []).map(app => ({
      appName: app.trackName,
      appStoreUrl: app.trackViewUrl,
      playStoreUrl: null,
      iconImageUrl: app.artworkUrl512 || app.artworkUrl100,
      developer: app.artistName,
    }));
  } catch (error) {
    console.error('iTunes search error:', error);
    return [];
  }
}

// 백엔드 Play Store 검색 API 호출
async function searchHeaderPlayStore(query) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/apps/search?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Play Store search error:', error);
    return [];
  }
}

// 검색 결과 병합 (개선된 매칭 로직)
function mergeHeaderResults(iTunesResults, playStoreResults) {
  const merged = [];
  const usedPlayStoreIndices = new Set();

  // iTunes 결과를 기준으로 Play Store 매칭 시도
  iTunesResults.forEach(iTunesApp => {
    const mergedApp = { ...iTunesApp };

    // 매칭되는 Play Store 앱 찾기
    const matchIndex = playStoreResults.findIndex((playApp, idx) => {
      if (usedPlayStoreIndices.has(idx)) return false;
      return isHeaderAppMatch(iTunesApp, playApp);
    });

    if (matchIndex !== -1) {
      const playApp = playStoreResults[matchIndex];
      mergedApp.playStoreUrl = playApp.playStoreUrl;
      if (!mergedApp.iconImageUrl && playApp.iconImageUrl) {
        mergedApp.iconImageUrl = playApp.iconImageUrl;
      }
      usedPlayStoreIndices.add(matchIndex);
    }

    merged.push(mergedApp);
  });

  // 매칭되지 않은 Play Store 결과 추가
  playStoreResults.forEach((playApp, idx) => {
    if (!usedPlayStoreIndices.has(idx)) {
      merged.push({ ...playApp });
    }
  });

  return merged.slice(0, 10);
}

// 두 앱이 같은 앱인지 판단 (유연한 매칭)
function isHeaderAppMatch(app1, app2) {
  const name1 = normalizeHeaderAppName(app1.appName);
  const name2 = normalizeHeaderAppName(app2.appName);

  // 1. 정규화된 이름이 정확히 일치
  if (name1 === name2) return true;

  // 2. 기본 이름(부제목 제거) 비교 - "배달의민족 - 무료배민클럽" vs "배달의민족"
  const baseName1 = normalizeHeaderAppName(getHeaderBaseName(app1.appName));
  const baseName2 = normalizeHeaderAppName(getHeaderBaseName(app2.appName));
  if (baseName1 && baseName2 && baseName1 === baseName2) return true;

  // 3. 한쪽 이름이 다른 쪽을 포함 (긴 이름의 50% 이상)
  const longer = name1.length > name2.length ? name1 : name2;
  const shorter = name1.length > name2.length ? name2 : name1;
  if (shorter.length >= 3 && longer.includes(shorter) && shorter.length >= longer.length * 0.5) {
    return true;
  }

  // 4. 기본 이름으로도 포함 여부 체크
  const longerBase = baseName1.length > baseName2.length ? baseName1 : baseName2;
  const shorterBase = baseName1.length > baseName2.length ? baseName2 : baseName1;
  if (shorterBase.length >= 3 && longerBase.includes(shorterBase)) {
    return true;
  }

  // 5. 개발자명이 일치하고 이름 유사도가 높음
  if (app1.developer && app2.developer) {
    const dev1 = normalizeHeaderAppName(app1.developer);
    const dev2 = normalizeHeaderAppName(app2.developer);
    if (dev1 === dev2 || dev1.includes(dev2) || dev2.includes(dev1)) {
      if (calculateHeaderSimilarity(baseName1, baseName2) > 0.5) {
        return true;
      }
    }
  }

  // 6. 이름 유사도가 매우 높음 (80% 이상)
  if (calculateHeaderSimilarity(name1, name2) > 0.8) {
    return true;
  }

  return false;
}

// 앱 이름에서 기본 이름 추출 (부제목 제거)
function getHeaderBaseName(name) {
  const separators = [' - ', ' – ', ' — ', ' : ', ' | ', ':', '|', ' · '];
  for (const sep of separators) {
    if (name.includes(sep)) {
      return name.split(sep)[0].trim();
    }
  }
  return name;
}

// 두 문자열의 유사도 계산 (0~1)
function calculateHeaderSimilarity(str1, str2) {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  let matches = 0;
  const shorterChars = shorter.split('');
  const longerChars = longer.split('');

  shorterChars.forEach(char => {
    const idx = longerChars.indexOf(char);
    if (idx !== -1) {
      matches++;
      longerChars.splice(idx, 1);
    }
  });

  return matches / longer.length;
}

// 앱 이름 정규화 (매칭용)
function normalizeHeaderAppName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '')
    .slice(0, 50);
}

function renderHeaderDropdown(results) {
  const dropdown = document.getElementById('header-search-dropdown');
  const dropdownItems = document.getElementById('header-dropdown-items');

  if (!results || results.length === 0) {
    dropdownItems.innerHTML = `
      <div class="flex items-center justify-center p-4 text-[#636e88] text-sm">
        검색 결과가 없습니다
      </div>
    `;
    dropdown.classList.remove('hidden');
    return;
  }

  dropdownItems.innerHTML = results.slice(0, 5).map(app => `
    <div class="flex items-center gap-3 rounded-lg p-2 hover:bg-primary/5 cursor-pointer transition-colors" data-app='${JSON.stringify(app).replace(/'/g, "&apos;")}'>
      <div class="bg-center bg-no-repeat bg-cover rounded-lg size-10 border border-gray-100" style="background-image: url('${app.iconImageUrl}')"></div>
      <div class="flex flex-1 flex-col text-left min-w-0">
        <div class="flex items-center gap-1.5 flex-wrap">
          <p class="text-[#111318] text-sm font-bold truncate">${app.appName}</p>
          ${app.playStoreUrl ? '<span class="rounded bg-green-100 px-1 py-0.5 text-[8px] font-bold text-green-700">PLAY</span>' : ''}
          ${app.appStoreUrl ? '<span class="rounded bg-blue-100 px-1 py-0.5 text-[8px] font-bold text-blue-700">iOS</span>' : ''}
        </div>
        ${app.developer ? `<p class="text-[#636e88] text-xs truncate">${app.developer}</p>` : ''}
      </div>
    </div>
  `).join('');

  dropdown.classList.remove('hidden');

  dropdownItems.querySelectorAll('[data-app]').forEach(item => {
    item.addEventListener('click', () => {
      const appData = item.dataset.app;
      if (appData) {
        const app = JSON.parse(appData.replace(/&apos;/g, "'"));
        const params = new URLSearchParams();
        if (app.appStoreUrl) params.set('appStoreUrl', app.appStoreUrl);
        if (app.playStoreUrl) params.set('playStoreUrl', app.playStoreUrl);
        if (app.appName) params.set('appName', app.appName);
        if (app.iconImageUrl) params.set('iconUrl', app.iconImageUrl);
        if (app.developer) params.set('developer', app.developer);
        window.location.href = `/analysis.html?${params.toString()}`;
      }
    });
  });
}

// PDF Download function
async function downloadAsPDF() {
  if (!analysisData) return;

  const btn = document.getElementById('download-pdf-btn');
  const originalContent = btn.innerHTML;
  btn.innerHTML = '<span class="material-symbols-outlined mr-2 text-lg animate-spin">sync</span>생성 중...';
  btn.disabled = true;

  try {
    // Use browser print functionality for PDF
    const printContent = document.getElementById('results').cloneNode(true);

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <title>${analysisData.appName || '앱 분석'} - 분석 결과</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', 'Noto Sans KR', sans-serif;
            padding: 20px;
            background: white;
          }
          .user-feedback, #email-popup { display: none !important; }
          @media print {
            body { padding: 0; }
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>
        <div class="max-w-4xl mx-auto">
          <div class="text-center mb-8">
            <h1 class="text-2xl font-bold text-gray-900">${analysisData.appName || '앱'} 분석 리포트</h1>
            <p class="text-gray-500 mt-2">${new Date().toLocaleDateString('ko-KR')} | 분석드가?</p>
          </div>
          ${printContent.innerHTML}
        </div>
        <script>
          setTimeout(() => {
            window.print();
            window.close();
          }, 500);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  } catch (error) {
    console.error('PDF generation error:', error);
    alert('PDF 생성 중 오류가 발생했습니다.');
  } finally {
    btn.innerHTML = originalContent;
    btn.disabled = false;
  }
}

// Mobile hamburger menu
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const drawer = document.getElementById('mobile-menu-drawer');
  const overlay = document.getElementById('mobile-menu-overlay');
  const closeBtn = document.getElementById('mobile-menu-close');

  if (!menuBtn || !drawer || !overlay) return;

  function openMenu() {
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
      overlay.classList.add('opacity-100');
      drawer.classList.remove('translate-x-full');
    });
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    overlay.classList.remove('opacity-100');
    drawer.classList.add('translate-x-full');
    setTimeout(() => overlay.classList.add('hidden'), 300);
    document.body.style.overflow = '';
  }

  menuBtn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);

  // Mobile search
  let mobileDebounceTimer;
  const mobileInput = document.getElementById('mobile-search-input');
  const mobileDropdown = document.getElementById('mobile-search-dropdown');
  const mobileDropdownItems = document.getElementById('mobile-dropdown-items');

  mobileInput.addEventListener('input', (e) => {
    clearTimeout(mobileDebounceTimer);
    mobileDebounceTimer = setTimeout(async () => {
      const query = e.target.value.trim();
      if (query.length < 2) {
        mobileDropdown.classList.add('hidden');
        return;
      }
      mobileDropdownItems.innerHTML = `
        <div class="flex items-center justify-center p-4 text-[#636e88] text-sm">
          <div class="w-4 h-4 border-2 border-gray-200 border-t-primary rounded-full animate-spin mr-2"></div>
          검색 중...
        </div>`;
      mobileDropdown.classList.remove('hidden');
      try {
        const [iTunesResults, playStoreResults] = await Promise.all([
          searchHeaderiTunes(query),
          searchHeaderPlayStore(query),
        ]);
        const merged = mergeHeaderResults(iTunesResults, playStoreResults);
        if (!merged || merged.length === 0) {
          mobileDropdownItems.innerHTML = `<div class="flex items-center justify-center p-4 text-[#636e88] text-sm">검색 결과가 없습니다</div>`;
          return;
        }
        mobileDropdownItems.innerHTML = merged.slice(0, 5).map(app => `
          <div class="flex items-center gap-3 rounded-lg p-2 hover:bg-primary/5 cursor-pointer transition-colors" data-app='${JSON.stringify(app).replace(/'/g, "&apos;")}'>
            <div class="bg-center bg-no-repeat bg-cover rounded-lg size-10 border border-gray-100" style="background-image: url('${app.iconImageUrl}')"></div>
            <div class="flex flex-1 flex-col text-left min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <p class="text-[#111318] text-sm font-bold truncate">${app.appName}</p>
                ${app.playStoreUrl ? '<span class="rounded bg-green-100 px-1 py-0.5 text-[8px] font-bold text-green-700">PLAY</span>' : ''}
                ${app.appStoreUrl ? '<span class="rounded bg-blue-100 px-1 py-0.5 text-[8px] font-bold text-blue-700">iOS</span>' : ''}
              </div>
              ${app.developer ? `<p class="text-[#636e88] text-xs truncate">${app.developer}</p>` : ''}
            </div>
          </div>`).join('');
        mobileDropdownItems.querySelectorAll('[data-app]').forEach(item => {
          item.addEventListener('click', () => {
            const appData = item.dataset.app;
            if (appData) {
              const app = JSON.parse(appData.replace(/&apos;/g, "'"));
              const params = new URLSearchParams();
              if (app.appStoreUrl) params.set('appStoreUrl', app.appStoreUrl);
              if (app.playStoreUrl) params.set('playStoreUrl', app.playStoreUrl);
              if (app.appName) params.set('appName', app.appName);
              if (app.iconImageUrl) params.set('iconUrl', app.iconImageUrl);
              if (app.developer) params.set('developer', app.developer);
              window.location.href = `/analysis.html?${params.toString()}`;
            }
          });
        });
      } catch (error) {
        mobileDropdown.classList.add('hidden');
      }
    }, 300);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#mobile-search-section')) {
      mobileDropdown.classList.add('hidden');
    }
  });
}
