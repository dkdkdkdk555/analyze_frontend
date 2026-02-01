import { renderRatingChart } from './components/rating-chart.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';
const params = new URLSearchParams(window.location.search);
const appStoreUrl = params.get('appStoreUrl');
const playStoreUrl = params.get('playStoreUrl');

let analysisData = null;
let feedbackSubmitted = false;
let selectedFeedback = null;
let headerDebounceTimer;
let selectedHeaderApp = null;
let loadingMessageInterval = null;

const loadingMessages = [
  '스토어 등록정보를 분석 중 입니다..',
  '각 스토어의 리뷰를 분석 중 입니다..',
  '웹서치하여 정성데이터를 분석 중 입니다..'
];
let currentLoadingMessageIndex = 0;

async function analyzeApp() {
  showLoading();

  try {
    const response = await fetch(`${API_BASE_URL}/api/apps/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appStoreUrl, playStoreUrl })
    });

    if (response.status === 429) {
      showLimited();
      return;
    }

    if (!response.ok) {
      showError();
      return;
    }

    analysisData = await response.json();
    renderResults(analysisData);
  } catch (error) {
    console.error('Analysis error:', error);
    showError();
  }
}

function renderResults(data) {
  stopLoading();
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('results').classList.remove('hidden');

  // App Header
  document.getElementById('app-icon').src = data.appIconUrl || '';
  document.getElementById('app-name').textContent = data.appName || '';
  document.getElementById('breadcrumb-app-name').textContent = `앱 분석: ${data.appName || ''}`;
  document.getElementById('app-meta').textContent = `분석 완료 | ${new Date().toLocaleDateString('ko-KR')}`;

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
      // Change text and fade in
      currentLoadingMessageIndex = (currentLoadingMessageIndex + 1) % loadingMessages.length;
      loadingText.textContent = loadingMessages[currentLoadingMessageIndex];
      loadingText.style.opacity = '1';
    }, 500);
  }, 7000);
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
  document.getElementById('email-popup').classList.remove('hidden');
}

function hideEmailPopup() {
  document.getElementById('email-popup').classList.add('hidden');
}

async function submitFeedback(isHelpful) {
  const curiousContent = document.getElementById('curious-content').value;

  try {
    await fetch(`${API_BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isHelpful, curiousContent })
    });

    feedbackSubmitted = true;
    const feedbackSection = document.querySelector('.user-feedback');
    feedbackSection.innerHTML = '<p>피드백 감사합니다!</p>';
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

    hideEmailPopup();
    alert('등록되었습니다. 런칭 시 알려드리겠습니다!');
  } catch (error) {
    console.error('Email signup error:', error);
    alert('오류가 발생했습니다. 다시 시도해주세요.');
  }
}

// Event listeners
document.getElementById('retry-btn')?.addEventListener('click', analyzeApp);

// Feedback button click handlers with persistent selected state
const feedbackYesBtn = document.getElementById('feedback-yes');
const feedbackNoBtn = document.getElementById('feedback-no');

feedbackYesBtn?.addEventListener('click', () => {
  selectedFeedback = true;
  feedbackYesBtn.classList.add('selected-yes');
  feedbackNoBtn.classList.remove('selected-no');
  document.getElementById('feedback-form')?.classList.remove('hidden');
});

feedbackNoBtn?.addEventListener('click', () => {
  selectedFeedback = false;
  feedbackNoBtn.classList.add('selected-no');
  feedbackYesBtn.classList.remove('selected-yes');
  document.getElementById('feedback-form')?.classList.remove('hidden');
});

document.getElementById('submit-feedback')?.addEventListener('click', () => {
  if (selectedFeedback !== null) {
    submitFeedback(selectedFeedback);
  }
});

document.getElementById('submit-email')?.addEventListener('click', submitEmail);
document.getElementById('close-popup')?.addEventListener('click', hideEmailPopup);
document.getElementById('email-signup-btn')?.addEventListener('click', showEmailPopup);

// PDF Download functionality
document.getElementById('download-pdf-btn')?.addEventListener('click', downloadAsPDF);

// Header search functionality
initHeaderSearch();

// Start analysis
analyzeApp();

// Initialize header search
function initHeaderSearch() {
  const input = document.getElementById('header-search-input');
  const dropdown = document.getElementById('header-search-dropdown');
  const analyzeBtn = document.getElementById('header-analyze-btn');

  if (!input || !dropdown || !analyzeBtn) return;

  input.addEventListener('input', (e) => {
    clearTimeout(headerDebounceTimer);
    headerDebounceTimer = setTimeout(() => searchHeaderApps(e.target.value), 300);
  });

  analyzeBtn.addEventListener('click', () => {
    if (selectedHeaderApp) {
      const params = new URLSearchParams();
      if (selectedHeaderApp.appStoreUrl) params.set('appStoreUrl', selectedHeaderApp.appStoreUrl);
      if (selectedHeaderApp.playStoreUrl) params.set('playStoreUrl', selectedHeaderApp.playStoreUrl);
      window.location.href = `/analysis.html?${params.toString()}`;
    }
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
  const dropdownItems = document.getElementById('header-dropdown-items');
  const analyzeBtn = document.getElementById('header-analyze-btn');

  if (!query || query.trim().length < 2) {
    dropdown.classList.add('hidden');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/apps/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search failed');
    const results = await response.json();
    renderHeaderDropdown(results);
  } catch (error) {
    console.error('Header search error:', error);
    dropdown.classList.add('hidden');
  }
}

function renderHeaderDropdown(results) {
  const dropdown = document.getElementById('header-search-dropdown');
  const dropdownItems = document.getElementById('header-dropdown-items');
  const input = document.getElementById('header-search-input');
  const analyzeBtn = document.getElementById('header-analyze-btn');

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
        selectedHeaderApp = JSON.parse(appData.replace(/&apos;/g, "'"));
        input.value = selectedHeaderApp.appName;
        dropdown.classList.add('hidden');
        analyzeBtn.disabled = false;
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
