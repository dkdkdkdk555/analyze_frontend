import { renderRatingChart } from './components/rating-chart.js';

const API_BASE_URL = ''; // Will be updated with actual Cloudflare Worker URL
const params = new URLSearchParams(window.location.search);
const appStoreUrl = params.get('appStoreUrl');
const playStoreUrl = params.get('playStoreUrl');

let analysisData = null;
let feedbackSubmitted = false;

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
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('results').classList.remove('hidden');

  document.getElementById('app-icon').src = data.appIconUrl;
  document.getElementById('app-name').textContent = data.appName;

  // Market Definition
  document.getElementById('market-definition').innerHTML = `
    <h2>시장 정의</h2>
    <div class="feature">
      <p><strong>TAM (전체 시장):</strong> ${data.market?.definition?.tam?.description || 'N/A'}</p>
      <p><strong>SAM (유효 시장):</strong> ${data.market?.definition?.sam?.description || 'N/A'}</p>
    </div>
  `;

  // Core Value
  document.getElementById('core-value').innerHTML = `
    <h2>핵심 가치</h2>
    <div class="feature">
      <p><strong>${data.coreValue?.statement || ''}</strong></p>
      <p>${data.coreValue?.detail || ''}</p>
    </div>
  `;

  // Core Features
  const features = data.coreFeatures || [];
  document.getElementById('core-features').innerHTML = `
    <h2>핵심 기능</h2>
    ${features.map(f => `
      <div class="feature">
        <p><strong>${f.feature}</strong></p>
        <p>사용자 인식: ${f.recognizedByUsers}</p>
      </div>
    `).join('')}
  `;

  // Unresolved Problems
  const problems = data.unresolvedProblems || [];
  document.getElementById('unresolved-problems').innerHTML = `
    <h2>미해결 문제</h2>
    ${problems.map(p => `
      <div class="problem ${p.signalStrength || ''}">
        <p><strong>${p.problem}</strong></p>
        <p>${p.description}</p>
        <small>신호 강도: ${p.signalStrength || 'N/A'}</small>
      </div>
    `).join('')}
  `;

  // Ratings Chart
  if (data.ratings?.distribution) {
    renderRatingChart('ratings-chart', data.ratings.distribution);
  }

  // Reviews by Rating
  const reviews = data.reviewsByRating || {};
  document.getElementById('reviews-by-rating').innerHTML = `
    <h2>평점별 리뷰 요약</h2>
    ${Object.entries(reviews).map(([rating, review]) => `
      <div class="review-summary">
        <h3>${rating}점</h3>
        <p>${review.summary}</p>
        <p><strong>키워드:</strong> ${(review.keywords || []).join(', ')}</p>
      </div>
    `).join('')}
  `;

  // Complaints
  const complaints = data.complaints || {};
  document.getElementById('complaints').innerHTML = `
    <h2>주요 불만 사항</h2>
    <div class="feature">
      <p><strong>UI/UX:</strong> ${complaints.uiUx?.description || 'N/A'}</p>
    </div>
    <div class="feature">
      <p><strong>성능:</strong> ${complaints.performance?.description || 'N/A'}</p>
    </div>
    <div class="feature">
      <p><strong>안정성:</strong> ${complaints.stability?.description || 'N/A'}</p>
    </div>
  `;

  // Strategy Suggestion
  document.getElementById('strategy-suggestion').innerHTML = `
    <h2>전략 제안</h2>
    <div class="feature">
      <p><strong>${data.strategySuggestion?.oneLine || ''}</strong></p>
      <p>${data.strategySuggestion?.reasoning || ''}</p>
    </div>
  `;

  // Scroll detection for email popup
  let emailPopupShown = false;
  window.addEventListener('scroll', () => {
    if (!emailPopupShown && (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
      emailPopupShown = true;
      showEmailPopup();
    }
  });
}

function showLoading() {
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('error').classList.add('hidden');
  document.getElementById('limited').classList.add('hidden');
  document.getElementById('results').classList.add('hidden');
}

function showError() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('error').classList.remove('hidden');
}

function showLimited() {
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

document.querySelectorAll('.feedback-buttons button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const isHelpful = e.target.dataset.helpful === 'true';
    document.getElementById('curious-content').classList.remove('hidden');
    document.getElementById('submit-feedback').classList.remove('hidden');

    document.getElementById('submit-feedback').onclick = () => submitFeedback(isHelpful);
  });
});

document.getElementById('submit-email')?.addEventListener('click', submitEmail);
document.getElementById('close-popup')?.addEventListener('click', hideEmailPopup);
document.getElementById('email-signup-btn')?.addEventListener('click', showEmailPopup);

// Start analysis
analyzeApp();
