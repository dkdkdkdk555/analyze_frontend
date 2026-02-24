import { initHeader } from './components/header.js';
import { initFooter } from './components/footer.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';

async function getAuthToken() {
  return localStorage.getItem('auth_token');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── 목록 뷰 ───────────────────────────────────────────────────────────────

function renderList(analyses) {
  const container = document.getElementById('list-container');
  container.innerHTML = analyses.map(a => {
    const isGroup = a.analysis_type === 'group';

    if (isGroup) {
      // Parse apps list for small icon collage
      let appList = [];
      try { appList = JSON.parse(a.apps_json || '[]'); } catch { /* */ }
      const iconCollage = appList.slice(0, 3).map(app =>
        app.iconUrl
          ? `<img src="${app.iconUrl}" alt="${app.appName}" class="w-6 h-6 rounded-md object-cover border-2 border-white -ml-1 first:ml-0" onerror="this.style.display='none'">`
          : `<div class="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-white text-xs font-bold border-2 border-white -ml-1 first:ml-0">${(app.appName || '?')[0]}</div>`
      ).join('');

      return `
        <a
          href="/group-analysis-result.html?id=${encodeURIComponent(a.group_analysis_id)}"
          class="analysis-item flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#e8eaf0] shadow-sm hover:border-primary hover:shadow-md transition-all text-left w-full"
        >
          <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-primary" style="font-size:24px">workspaces</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <p class="text-base font-bold text-[#111318] truncate">${a.app_identifier}</p>
              <span class="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full flex-shrink-0">그룹</span>
            </div>
            <div class="flex items-center gap-1 mb-0.5">${iconCollage}</div>
            <p class="text-xs text-[#636e88] mt-0.5">${formatDate(a.created_at)}</p>
          </div>
          <span class="material-symbols-outlined text-[#c4c8d4] text-xl shrink-0">chevron_right</span>
        </a>
      `;
    }

    const iconUrl = a.app_icon_url || '';
    const iconHtml = iconUrl
      ? `<img src="${iconUrl}" alt="${a.app_identifier}" class="w-12 h-12 rounded-xl object-cover shrink-0" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : '';
    const fallbackHtml = `<div class="${iconUrl ? 'hidden' : 'flex'} w-12 h-12 rounded-xl bg-primary items-center justify-center text-white font-bold text-lg shrink-0">${(a.app_identifier || '?')[0].toUpperCase()}</div>`;

    return `
      <button
        data-id="${a.id}"
        class="analysis-item flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#e8eaf0] shadow-sm hover:border-primary hover:shadow-md transition-all text-left w-full"
      >
        <div class="shrink-0">
          ${iconHtml}
          ${fallbackHtml}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-base font-bold text-[#111318] truncate">${a.app_identifier}</p>
          <p class="text-xs text-[#636e88] mt-0.5">${formatDate(a.created_at)}</p>
        </div>
        <span class="material-symbols-outlined text-[#c4c8d4] text-xl shrink-0">chevron_right</span>
      </button>
    `;
  }).join('');

  container.querySelectorAll('button.analysis-item').forEach(btn => {
    btn.addEventListener('click', () => loadDetail(btn.dataset.id));
  });
}

// ─── 상세 뷰 렌더링 헬퍼 (analysis.html 동일 스타일) ──────────────────────────

function getBadgeClass(recognition) {
  if (!recognition) return 'bg-gray-100 text-gray-700';
  const lower = recognition.toLowerCase();
  if (lower.includes('positive') || lower.includes('긍정')) return 'bg-green-100 text-green-700';
  if (lower.includes('negative') || lower.includes('부정')) return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-700';
}

function getStrengthClass(strength) {
  if (!strength) return { icon: 'text-gray-400', iconName: 'info', badge: 'text-gray-600 bg-gray-50' };
  const lower = strength.toLowerCase();
  if (lower === 'strong' || lower === '강함') return { icon: 'text-red-500', iconName: 'warning', badge: 'text-red-600 bg-red-50' };
  if (lower === 'medium' || lower === '중간') return { icon: 'text-orange-500', iconName: 'info', badge: 'text-orange-600 bg-orange-50' };
  return { icon: 'text-gray-400', iconName: 'info', badge: 'text-gray-600 bg-gray-50' };
}

function getSignalBars(strength) {
  const lower = (strength || '').toLowerCase();
  let activeBars = 1;
  let colorClass = 'bg-gray-200';
  if (lower === 'strong' || lower === '강함') { activeBars = 3; colorClass = 'bg-red-500'; }
  else if (lower === 'medium' || lower === '중간') { activeBars = 2; colorClass = 'bg-orange-500'; }
  return [1, 2, 3].map(i => `<div class="w-1 h-3 rounded-full ${i <= activeBars ? colorClass : 'bg-gray-200'}"></div>`).join('');
}

function renderDetailStars(rating) {
  const filled = Math.min(5, Math.max(0, rating));
  const starColor = rating >= 4 ? 'text-yellow-400' : 'text-red-400';
  return [1, 2, 3, 4, 5].map(i =>
    i <= filled
      ? `<span class="material-symbols-outlined text-sm ${starColor}" style="font-variation-settings:'FILL' 1">star</span>`
      : `<span class="material-symbols-outlined text-sm text-gray-200">star</span>`
  ).join('');
}

function renderDetailRatings(ratings) {
  const distribution = ratings.distribution || {};
  const total = Object.values(distribution).reduce((a, b) => a + b, 0) || 1;
  const avg = Object.entries(distribution).reduce((acc, [star, count]) => acc + (parseInt(star) * count), 0) / total;
  const colors = ['#1d5ae7', '#4b7bee', '#94b2f4', '#c7d7fa', '#e0e7ff'];

  let cumulativePercent = 0;
  const gradientParts = [5, 4, 3, 2, 1].map((star, idx) => {
    const pct = ((distribution[star] || 0) / total) * 100;
    const part = `${colors[idx]} ${cumulativePercent}% ${cumulativePercent + pct}%`;
    cumulativePercent += pct;
    return part;
  });

  const legendRows = [5, 4, 3, 2, 1].map((star, idx) => {
    const pct = (((distribution[star] || 0) / total) * 100).toFixed(0);
    return `<div class="flex items-center justify-between text-xs">
      <span class="flex items-center gap-2"><div class="w-2 h-2 rounded-full" style="background:${colors[idx]}"></div>${star}점</span>
      <span class="font-bold">${pct}%</span>
    </div>`;
  }).join('');

  return `
    <div class="bg-white border border-[#dcdee5] rounded-xl p-4 md:p-8 flex flex-col items-center">
      <div class="relative w-32 h-32 md:w-40 md:h-40">
        <div class="w-full h-full rounded-full" style="background:conic-gradient(${gradientParts.join(',')})"></div>
        <div class="absolute inset-3 md:inset-4 bg-white rounded-full flex flex-col items-center justify-center">
          <span class="text-2xl md:text-3xl font-bold">${avg.toFixed(1)}</span>
          <span class="text-[10px] text-gray-500">평균 평점</span>
        </div>
      </div>
      <div class="mt-4 w-full space-y-1.5">${legendRows}</div>
    </div>`;
}

function renderDetailReviews(reviewsByRating) {
  const entries = Object.entries(reviewsByRating).sort(([a], [b]) => parseInt(b) - parseInt(a));
  if (!entries.length) return '';
  const rows = entries.map(([rating, review]) => {
    const label = parseInt(rating) >= 4 ? '긍정' : parseInt(rating) >= 3 ? '중립' : '부정';
    const keywords = review.keywords?.length
      ? `<div class="flex flex-wrap gap-1 mt-1">${review.keywords.map(k => `<span class="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">${k}</span>`).join('')}</div>`
      : '';
    return `<div class="p-3 md:p-4">
      <div class="flex items-center gap-2 mb-2 flex-wrap">
        ${renderDetailStars(parseInt(rating))}
        <span class="text-[10px] font-bold ml-1">${rating}점 (${label})</span>
      </div>
      <p class="text-xs md:text-sm text-[#636e88] mb-1">${review.summary || ''}</p>
      ${keywords}
    </div>`;
  }).join('');
  return `<div class="bg-white border border-[#dcdee5] rounded-xl divide-y divide-gray-100">${rows}</div>`;
}

function renderDetailComplaintCard(icon, title, complaint) {
  if (!complaint) return '';
  const items = complaint.description ? [complaint.description] : [];
  if (complaint.items) items.push(...complaint.items);
  const listHtml = items.slice(0, 3).map(item =>
    `<li class="flex gap-2"><div class="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div><p class="text-xs md:text-sm">${item}</p></li>`
  ).join('') || '<li class="text-xs text-gray-400">데이터 없음</li>';
  return `
    <div class="bg-white border border-[#dcdee5] rounded-xl p-4 md:p-5">
      <div class="flex items-center gap-2 mb-3 border-b pb-2 border-gray-100">
        <span class="material-symbols-outlined text-primary text-lg">${icon}</span>
        <h3 class="font-bold text-sm md:text-base">${title}</h3>
      </div>
      <ul class="space-y-2">${listHtml}</ul>
    </div>`;
}

window.downloadDetailAsPDF = function(appName) {
  const title = document.title;
  document.title = `${appName} 분석결과 - 분석드가?`;
  window.print();
  document.title = title;
};

function renderDetail(analysis, data) {
  const iconUrl = analysis.app_icon_url || data.appIconUrl || '';
  const appName = data.appName || analysis.app_identifier || '';

  const storeLinksHtml = [
    data.appStoreUrl ? `<a href="${data.appStoreUrl}" target="_blank" rel="noopener" class="no-print inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#dcdee5] rounded-lg text-[#636e88] hover:border-primary hover:text-primary transition-colors bg-white">
      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
      App Store
    </a>` : '',
    data.playStoreUrl ? `<a href="${data.playStoreUrl}" target="_blank" rel="noopener" class="no-print inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#dcdee5] rounded-lg text-[#636e88] hover:border-primary hover:text-primary transition-colors bg-white">
      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.76c.3.17.64.26.98.26.35 0 .7-.09 1.01-.27l13.23-7.5-2.88-2.9-12.34 10.41zM.44 1.33C.17 1.62 0 2.05 0 2.6v18.8c0 .55.17.98.44 1.27l.07.07 10.53-10.53v-.25L.51 1.26l-.07.07zM22.54 10.27l-2.89-1.64-3.23 3.22 3.23 3.24 2.9-1.65c.83-.47.83-1.23 0-1.7v-.47zM4.16.25L17.39 7.75l-2.88 2.89L2.17.22C2.48.05 2.83-.03 3.18.01c.34.03.67.12.98.24z"/></svg>
      Play Store
    </a>` : '',
  ].filter(Boolean).join('');

  // Header (analysis.html 프로필 헤더와 동일)
  document.getElementById('detail-header').innerHTML = `
    <div class="flex flex-col sm:flex-row gap-4 md:gap-6 items-center sm:items-start">
      ${iconUrl
        ? `<img src="${iconUrl}" alt="${appName}" class="w-16 h-16 md:w-24 md:h-24 rounded-xl border border-gray-100 object-cover shrink-0">`
        : `<div class="w-16 h-16 md:w-24 md:h-24 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-2xl shrink-0">${(appName || '?')[0].toUpperCase()}</div>`
      }
      <div class="text-center sm:text-left flex-1 min-w-0">
        <h1 class="text-xl md:text-[28px] font-bold leading-tight">${appName}</h1>
        <p class="text-[#636e88] text-sm mt-1">${formatDate(analysis.created_at)}</p>
        ${storeLinksHtml ? `<div class="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">${storeLinksHtml}</div>` : ''}
      </div>
      <button onclick="downloadDetailAsPDF('${appName.replace(/'/g, "\\'")}')" class="no-print shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#dcdee5] rounded-lg text-[#636e88] hover:border-primary hover:text-primary transition-colors bg-white self-start">
        <span class="material-symbols-outlined text-sm">download</span>
        PDF 저장
      </button>
    </div>`;

  const sections = [];

  // 01. 시장 정의
  if (data.market?.definition) {
    const { tam, sam } = data.market.definition;
    sections.push(`
      <section class="mb-8 md:mb-10">
        <div class="flex items-center gap-2 mb-3 md:mb-4">
          <span class="text-primary font-bold text-sm md:text-base">01.</span>
          <h2 class="text-lg md:text-[22px] font-bold leading-tight">시장 정의</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div class="flex flex-col gap-2 rounded-xl p-4 md:p-6 border border-[#dcdee5] bg-white">
            <p class="text-[#636e88] text-xs font-medium uppercase tracking-wider">TAM (Total Addressable Market)</p>
            <p class="text-[#111318] text-2xl md:text-3xl font-bold">${tam?.size || 'N/A'}</p>
            <p class="text-xs md:text-sm text-gray-500">${tam?.description || ''}</p>
          </div>
          <div class="flex flex-col gap-2 rounded-xl p-4 md:p-6 border border-[#dcdee5] bg-white">
            <p class="text-[#636e88] text-xs font-medium uppercase tracking-wider">SAM (Serviceable Available Market)</p>
            <p class="text-[#111318] text-2xl md:text-3xl font-bold">${sam?.size || 'N/A'}</p>
            <p class="text-xs md:text-sm text-gray-500">${sam?.description || ''}</p>
          </div>
        </div>
      </section>`);
  }

  // 02. 핵심 가치
  if (data.coreValue) {
    sections.push(`
      <section class="mb-8 md:mb-10">
        <div class="flex items-center gap-2 mb-3 md:mb-4">
          <span class="text-primary font-bold text-sm md:text-base">02.</span>
          <h2 class="text-lg md:text-[22px] font-bold leading-tight">핵심 가치</h2>
        </div>
        <div class="bg-primary/5 border border-primary/20 rounded-xl p-4 md:p-8">
          <p class="text-primary text-base md:text-xl lg:text-2xl font-bold leading-relaxed">${data.coreValue.statement || ''}</p>
          <p class="mt-4 md:mt-6 text-[#636e88] text-sm md:text-lg leading-relaxed">${data.coreValue.detail || ''}</p>
        </div>
      </section>`);
  }

  // 03. 핵심 기능  &  04. 미해결 문제
  const hasFeatures = data.coreFeatures?.length;
  const hasProblems = data.unresolvedProblems?.length;
  if (hasFeatures || hasProblems) {
    const featureIcons = ['send_money', 'show_chart', 'account_balance_wallet', 'card_giftcard', 'star'];
    const featuresHtml = hasFeatures ? `
      <section>
        <div class="flex items-center gap-2 mb-3 md:mb-4">
          <span class="text-primary font-bold text-sm md:text-base">03.</span>
          <h2 class="text-lg md:text-[22px] font-bold leading-tight">핵심 기능</h2>
        </div>
        <div class="bg-white border border-[#dcdee5] rounded-xl overflow-hidden">
          <ul class="divide-y divide-gray-100">
            ${data.coreFeatures.map((f, i) => `
              <li class="p-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-primary">${featureIcons[i % featureIcons.length]}</span>
                  <span class="font-medium text-sm md:text-base">${f.feature}</span>
                </div>
                <span class="px-2 md:px-3 py-1 ${getBadgeClass(f.recognizedByUsers)} rounded-full text-[10px] md:text-xs font-bold uppercase">${f.recognizedByUsers}</span>
              </li>`).join('')}
          </ul>
        </div>
      </section>` : '';

    const problemsHtml = hasProblems ? `
      <section>
        <div class="flex items-center gap-2 mb-3 md:mb-4">
          <span class="text-primary font-bold text-sm md:text-base">04.</span>
          <h2 class="text-lg md:text-[22px] font-bold leading-tight">미해결 문제</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          ${data.unresolvedProblems.map(p => {
            const sc = getStrengthClass(p.signalStrength);
            return `<div class="p-3 md:p-4 border border-[#dcdee5] bg-white rounded-xl flex flex-col gap-2 md:gap-3">
              <div class="flex justify-between">
                <span class="material-symbols-outlined ${sc.icon}">${sc.iconName}</span>
                <div class="flex gap-0.5">${getSignalBars(p.signalStrength)}</div>
              </div>
              <p class="font-bold text-xs md:text-sm">${p.problem}</p>
              <p class="text-[10px] md:text-xs text-gray-500">${p.description}</p>
              <span class="text-[10px] font-bold ${sc.badge} px-1.5 py-0.5 self-start rounded">${p.signalStrength?.toUpperCase() || 'N/A'}</span>
            </div>`;
          }).join('')}
        </div>
      </section>` : '';

    sections.push(`
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-10">
        ${featuresHtml}
        ${problemsHtml}
      </div>`);
  }

  // 05. 평점 분포  &  06. 평점별 리뷰 요약
  if (data.ratings?.distribution) {
    const reviewsHtml = data.reviewsByRating ? renderDetailReviews(data.reviewsByRating) : '';
    sections.push(`
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-10">
        <div class="lg:col-span-1">
          <div class="flex items-center gap-2 mb-3 md:mb-4">
            <span class="text-primary font-bold text-sm md:text-base">05.</span>
            <h2 class="text-lg md:text-[22px] font-bold leading-tight">평점 분포</h2>
          </div>
          ${renderDetailRatings(data.ratings)}
        </div>
        ${reviewsHtml ? `
        <div class="lg:col-span-2">
          <div class="flex items-center gap-2 mb-3 md:mb-4">
            <span class="text-primary font-bold text-sm md:text-base">06.</span>
            <h2 class="text-lg md:text-[22px] font-bold leading-tight">평점별 리뷰 요약</h2>
          </div>
          ${reviewsHtml}
        </div>` : ''}
      </div>`);
  }

  // 07. 불만 카테고리
  if (data.complaints) {
    sections.push(`
      <section class="mb-8 md:mb-10">
        <div class="flex items-center gap-2 mb-3 md:mb-4">
          <span class="text-primary font-bold text-sm md:text-base">07.</span>
          <h2 class="text-lg md:text-[22px] font-bold leading-tight">불만 카테고리</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          ${renderDetailComplaintCard('grid_view', 'UI / UX', data.complaints.uiUx)}
          ${renderDetailComplaintCard('speed', '성능', data.complaints.performance)}
          ${renderDetailComplaintCard('security', '안정성', data.complaints.stability)}
        </div>
      </section>`);
  }

  // 08. 전략 제안
  if (data.strategySuggestion) {
    sections.push(`
      <section class="mb-8 md:mb-12">
        <div class="bg-primary rounded-xl p-4 md:p-8 shadow-lg shadow-primary/20 text-white">
          <div class="flex items-center gap-2 mb-2">
            <span class="material-symbols-outlined text-lg md:text-xl">lightbulb</span>
            <h2 class="text-sm md:text-lg font-bold uppercase tracking-wider">전략 제안</h2>
          </div>
          <p class="text-lg md:text-2xl font-bold leading-snug">${data.strategySuggestion.oneLine || ''}</p>
          <p class="mt-2 md:mt-4 text-sm md:text-base opacity-90">${data.strategySuggestion.reasoning || ''}</p>
        </div>
      </section>`);
  }

  document.getElementById('detail-sections').innerHTML = sections.join('');
}

// ─── 상세 로드 ───────────────────────────────────────────────────────────────

async function loadDetail(id) {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/analyses?id=${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return;
  const { analysis } = await res.json();
  const data = JSON.parse(analysis.result_json);

  document.getElementById('list-view').classList.add('hidden');
  document.getElementById('detail-view').classList.remove('hidden');
  window.scrollTo(0, 0);

  renderDetail(analysis, data);
}

// ─── 초기화 ──────────────────────────────────────────────────────────────────

async function init() {
  await initHeader({ page: 'my-analyses', apiBaseUrl: API_BASE_URL });
  initFooter();

  const token = await getAuthToken();

  document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('detail-view').classList.add('hidden');
    document.getElementById('list-view').classList.remove('hidden');
    window.scrollTo(0, 0);
  });

  if (!token) {
    document.getElementById('list-loading').classList.add('hidden');
    document.getElementById('list-unauth').classList.remove('hidden');
    return;
  }

  const res = await fetch(`${API_BASE_URL}/api/analyses`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  document.getElementById('list-loading').classList.add('hidden');

  if (res.status === 401) {
    document.getElementById('list-unauth').classList.remove('hidden');
    return;
  }

  const { analyses } = await res.json();

  if (!analyses || analyses.length === 0) {
    document.getElementById('list-empty').classList.remove('hidden');
    return;
  }

  document.getElementById('list-container').classList.remove('hidden');
  renderList(analyses);

  // Auto-open specific analysis if ?id= param present
  const urlId = new URLSearchParams(location.search).get('id');
  if (urlId) {
    loadDetail(parseInt(urlId, 10));
  }
}

init();
