import { renderRatingChart } from '../components/rating-chart.js';
import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { getLang, getMarket, t, applyTranslations } from '../components/i18n.js';
import { getVisitorId } from '../components/fingerprint.js';

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
let loadingMessageInterval = null;
let exposureSent = false;
let userHasEmail = false; // Flag to track if user already submitted email
let loadingStartTime = null; // Track when loading started
let pendingAnalysisData = null; // Store analysis result while waiting for minimum loading time
let isGuestUser = false; // Track if current analysis is for a guest user

// Minimum loading time: 21 seconds (7 seconds × 3 messages) to show video ad
const MIN_LOADING_TIME_MS = 21000;
const LOADING_MESSAGE_INTERVAL_MS = 7000;

const loadingMessages = getLang() === 'en'
  ? [
      'Analyzing app store listings..',
      'Analyzing reviews from each store..',
      'Web searching for qualitative data..'
    ]
  : [
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
    const authToken = localStorage.getItem('auth_token');
    const analyzeHeaders = { 'Content-Type': 'application/json' };
    if (authToken) analyzeHeaders['Authorization'] = `Bearer ${authToken}`;

    const response = await fetch(`${API_BASE_URL}/api/apps/analyze`, {
      method: 'POST',
      headers: analyzeHeaders,
      body: JSON.stringify({
        appStoreUrl,
        playStoreUrl,
        abText: AB_TEXT,
        lang: getLang(),
        market: getMarket(),
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

    if (response.status === 402) {
      // No credits remaining - show modal immediately
      stopLoading();
      document.getElementById('loading').classList.add('hidden');
      showNoCreditsModal();
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
    isGuestUser = analysisData.isGuest === true;
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

  // App Header
  document.getElementById('app-icon').src = data.appIconUrl || '';
  document.getElementById('app-name').textContent = data.appName || '';
  document.getElementById('breadcrumb-app-name').textContent = `${t('analysis.app_analysis_prefix')}: ${data.appName || ''}`;
  document.getElementById('app-meta').textContent = `${t('analysis.analysis_done')} | ${new Date().toLocaleDateString(getLang() === 'en' ? 'en-US' : 'ko-KR')}`;

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
  if (isGuestUser || !reviews || Object.keys(reviews).length === 0) {
    // Guest user: show blur on content only (header stays visible)
    renderReviewsListBlur('reviews-list');
  } else {
    document.getElementById('reviews-list').innerHTML = Object.entries(reviews)
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
      .map(([rating, review]) => {
        const stars = renderStars(parseInt(rating));
        const label = parseInt(rating) >= 4 ? t('analysis.review_positive') : parseInt(rating) >= 3 ? t('analysis.review_neutral') : t('analysis.review_negative');
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
  }

  // 07. Complaints
  const complaints = data.complaints || {};
  if (isGuestUser) {
    // Guest user: show single blur overlay on all complaint cards
    renderComplaintsBlur();
  } else {
    renderComplaintList('complaints-uiux-list', complaints.uiUx);
    renderComplaintList('complaints-performance-list', complaints.performance);
    renderComplaintList('complaints-stability-list', complaints.stability);
  }

  // 08. Strategy Suggestion
  if (isGuestUser || !data.strategySuggestion) {
    // Guest user: show blur on content only (header stays visible)
    renderStrategyBlur();
  } else {
    document.getElementById('strategy-oneline').textContent = data.strategySuggestion?.oneLine || '';
    document.getElementById('strategy-reasoning').textContent = data.strategySuggestion?.reasoning || '';
  }

  // Scroll detection for bottom popup
  let bottomPopupShown = false;
  window.addEventListener('scroll', () => {
    if (!bottomPopupShown && (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
      bottomPopupShown = true;
      showBottomPopup();
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

/**
 * Create blur overlay element with lock icon and message
 */
function createBlurOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'guest-blur-overlay absolute inset-0 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer z-10 rounded-lg';
  overlay.innerHTML = `
    <span class="material-symbols-outlined text-2xl md:text-3xl text-primary mb-1.5">lock</span>
    <p class="text-xs md:text-sm font-bold text-[#111318] mb-0.5">${t('guest.blur_unlock')}</p>
    <p class="text-[10px] md:text-xs text-primary font-medium">${t('guest.blur_signup_credit')}</p>
  `;
  overlay.addEventListener('click', showGuestSignupModal);
  return overlay;
}

/**
 * Render blur overlay on all complaint cards for guest users
 * Section header (07. Complaint Categories) stays visible, cards get single overlay
 */
function renderComplaintsBlur() {
  const complaintsSection = document.getElementById('complaints');
  if (!complaintsSection) return;

  // Get the grid container (contains all 3 cards)
  const grid = complaintsSection.querySelector('.grid');
  if (!grid) return;

  // Add placeholder items to each list
  const lists = ['complaints-uiux-list', 'complaints-performance-list', 'complaints-stability-list'];
  lists.forEach(listId => {
    const list = document.getElementById(listId);
    if (list) {
      list.innerHTML = `
        <li class="flex gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-gray-200 mt-1.5 flex-shrink-0"></div>
          <p class="text-xs md:text-sm text-gray-300">Sign up to view detailed analysis</p>
        </li>
        <li class="flex gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-gray-200 mt-1.5 flex-shrink-0"></div>
          <p class="text-xs md:text-sm text-gray-300">Unlock full complaint insights</p>
        </li>
      `;
    }
  });

  // Make grid container relative and add single overlay covering all cards
  grid.style.position = 'relative';
  grid.appendChild(createBlurOverlay());
}

/**
 * Render blur overlay on reviews list content for guest users
 * Section header (06. Reviews by Rating) stays visible
 */
function renderReviewsListBlur(listId) {
  const list = document.getElementById(listId);
  if (!list) return;

  // Add placeholder review items (hidden behind blur)
  list.innerHTML = `
    <div class="p-3 md:p-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-gray-200">★★★★★</span>
        <span class="text-[10px] md:text-xs font-bold text-gray-300">5</span>
      </div>
      <p class="text-xs md:text-sm text-gray-300 mb-2">Sign up to view detailed review analysis.</p>
    </div>
    <div class="p-3 md:p-4 border-t border-gray-100">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-gray-200">★★★☆☆</span>
        <span class="text-[10px] md:text-xs font-bold text-gray-300">3</span>
      </div>
      <p class="text-xs md:text-sm text-gray-300 mb-2">Unlock full review insights and summaries.</p>
    </div>
    <div class="p-3 md:p-4 border-t border-gray-100">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-gray-200">★☆☆☆☆</span>
        <span class="text-[10px] md:text-xs font-bold text-gray-300">1</span>
      </div>
      <p class="text-xs md:text-sm text-gray-300 mb-2">Get access to complete analysis results.</p>
    </div>
  `;

  // Make list container relative and add overlay
  list.style.position = 'relative';
  list.appendChild(createBlurOverlay());
}

/**
 * Render blur overlay on strategy content for guest users
 * Header (lightbulb icon + "Strategy Suggestion") stays visible, only content is blurred
 */
function renderStrategyBlur() {
  const oneline = document.getElementById('strategy-oneline');
  const reasoning = document.getElementById('strategy-reasoning');

  if (!oneline || !reasoning) return;

  // Add placeholder text (hidden behind blur)
  oneline.textContent = 'Sign up to unlock strategic recommendations.';
  oneline.style.color = 'rgba(255,255,255,0.5)';
  reasoning.textContent = 'Get personalized strategy insights based on comprehensive app analysis and user feedback patterns.';
  reasoning.style.color = 'rgba(255,255,255,0.3)';

  // Create a wrapper div around the content (not the header)
  const contentWrapper = document.createElement('div');
  contentWrapper.style.position = 'relative';
  contentWrapper.style.minHeight = '80px';

  // Move oneline and reasoning into the wrapper
  const parent = oneline.parentElement;
  parent.insertBefore(contentWrapper, oneline);
  contentWrapper.appendChild(oneline);
  contentWrapper.appendChild(reasoning);

  // Create custom overlay for strategy (white text on primary bg)
  const overlay = document.createElement('div');
  overlay.className = 'guest-blur-overlay absolute inset-0 bg-primary/80 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer z-10 rounded-lg';
  overlay.innerHTML = `
    <span class="material-symbols-outlined text-2xl md:text-3xl text-white mb-1.5">lock</span>
    <p class="text-xs md:text-sm font-bold text-white mb-0.5">${t('guest.blur_unlock')}</p>
    <p class="text-[10px] md:text-xs text-white/80 font-medium">${t('guest.blur_signup_credit')}</p>
  `;
  overlay.addEventListener('click', showGuestSignupModal);
  contentWrapper.appendChild(overlay);
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
}

function showNoCreditsModal() {
  document.getElementById('no-credits-modal')?.classList.remove('hidden');
}

function hideNoCreditsModal() {
  document.getElementById('no-credits-modal')?.classList.add('hidden');
}

/**
 * Show guest signup modal
 */
function showGuestSignupModal() {
  document.getElementById('guest-signup-modal')?.classList.remove('hidden');
}

/**
 * Hide guest signup modal
 */
function hideGuestSignupModal() {
  document.getElementById('guest-signup-modal')?.classList.add('hidden');
}

/**
 * Show duplicate credit modal
 */
function showDuplicateCreditModal() {
  document.getElementById('duplicate-credit-modal')?.classList.remove('hidden');
}

/**
 * Hide duplicate credit modal
 */
function hideDuplicateCreditModal() {
  document.getElementById('duplicate-credit-modal')?.classList.add('hidden');
}


function showBottomPopup() {
  // Don't show popup if user already submitted email
  if (userHasEmail) return;
  // Reset to step 1
  document.getElementById('research-popup')?.classList.remove('hidden');
  document.getElementById('bottom-popup').classList.remove('hidden');
}

function hideBottomPopup() {
  document.getElementById('bottom-popup').classList.add('hidden');
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
    feedbackSection.innerHTML = `<p class="text-center py-8 text-[#636e88] font-medium">${t('analysis.feedback_thanks')}</p>`;
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
    hideBottomPopup();
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

document.getElementById('close-popup')?.addEventListener('click', hideBottomPopup);
document.getElementById('close-no-credits-modal')?.addEventListener('click', hideNoCreditsModal);

// Guest signup modal events
document.getElementById('guest-signup-btn')?.addEventListener('click', () => {
  window.location.href = `${API_BASE_URL}/api/auth/google`;
});
document.getElementById('close-guest-signup-modal')?.addEventListener('click', hideGuestSignupModal);

// Limited state login button → directly trigger Google OAuth (same as header login btn)
document.getElementById('limited-login-btn')?.addEventListener('click', () => {
  window.location.href = `${API_BASE_URL}/api/auth/google`;
});


// Duplicate credit modal events
document.getElementById('close-duplicate-credit-modal')?.addEventListener('click', hideDuplicateCreditModal);

// Stage buttons (email step 2)
document.querySelectorAll('.stage-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    submitEmailRegistWhy(btn.dataset.value);
  });
});
document.getElementById('skip-stage')?.addEventListener('click', hideBottomPopup);

// PDF Download functionality
document.getElementById('download-pdf-btn')?.addEventListener('click', downloadAsPDF);

// Group analysis button: navigate directly
document.getElementById('group-analyze-btn')?.addEventListener('click', () => {
  const groupParams = new URLSearchParams();
  if (appName) groupParams.set('appName', appName);
  if (appStoreUrl) groupParams.set('appStoreUrl', appStoreUrl);
  if (playStoreUrl) groupParams.set('playStoreUrl', playStoreUrl);
  if (iconUrl) groupParams.set('iconUrl', iconUrl);
  window.location.href = `/analysis/group-analysis.html?${groupParams.toString()}`;
});

// Apply i18n translations to static section labels
applyTranslations();

// Update OG/Twitter meta tags and html lang based on active language
(function updateOgMeta() {
  const lang = getLang();
  const isKo = lang === 'ko';
  const title = isKo ? '앱 분석 결과 - TalonInsight' : 'App Analysis Results - TalonInsight';
  const desc = isKo
    ? '앱 분석 결과를 확인하세요. 시장 정의, 핵심 가치, 리뷰 분석, 미해결 문제 등 상세한 인사이트를 제공합니다.'
    : 'View your app analysis results. Get detailed insights on market definition, core values, review analysis, and unresolved user pain points.';
  const locale = isKo ? 'ko_KR' : 'en_US';
  document.documentElement.lang = lang;
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', desc);
  document.querySelector('meta[property="og:locale"]')?.setAttribute('content', locale);
  document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', desc);
  document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
})();

// Initialize header (search + mobile menu)
initHeader({ page: 'analysis', apiBaseUrl: API_BASE_URL });
initFooter();

// Pre-flight check: verify logged-in user has quota before starting analysis
async function checkAnalyzeQuota() {
  const authToken = localStorage.getItem('auth_token');
  if (!authToken) return true; // Non-logged-in: IP rate limit handled by backend

  try {
    const res = await fetch(`${API_BASE_URL}/api/analyze/check`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) return true; // On error, let backend handle it
    const data = await res.json();
    return data.canAnalyze !== false;
  } catch {
    return true; // On network error, let backend handle it
  }
}

// Initialize page (async to ensure user status is checked first)
(async function init() {
  // Check user status first (wait for completion to know if email popup should show)
  await checkUserStatus();

  // Send exposure event on page load
  sendExposureEvent();

  // Pre-check quota for logged-in users before starting analysis
  const canAnalyze = await checkAnalyzeQuota();
  if (!canAnalyze) {
    showNoCreditsModal();
    return;
  }

  // Start analysis
  analyzeApp();
})();



// PDF Download function
async function downloadAsPDF() {
  if (!analysisData) return;

  // Block PDF download for guest users
  if (isGuestUser) {
    showGuestSignupModal();
    return;
  }

  const btn = document.getElementById('download-pdf-btn');
  const originalContent = btn.innerHTML;
  btn.innerHTML = '<span class="material-symbols-outlined mr-2 text-lg animate-spin">sync</span>생성 중...';
  btn.disabled = true;

  try {
    // Use browser print functionality for PDF
    const printContent = document.getElementById('results').cloneNode(true);

    // Remove blur overlays from print content
    printContent.querySelectorAll('.guest-blur-overlay').forEach(el => el.remove());

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
            <p class="text-gray-500 mt-2">${new Date().toLocaleDateString('ko-KR')} | TalonInsight</p>
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

