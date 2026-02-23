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

  container.querySelectorAll('.analysis-item').forEach(btn => {
    btn.addEventListener('click', () => loadDetail(btn.dataset.id));
  });
}

// ─── 상세 뷰 렌더링 ─────────────────────────────────────────────────────────

function signalBadge(strength) {
  const map = { strong: ['강함', 'bg-red-100 text-red-600'], medium: ['보통', 'bg-yellow-100 text-yellow-700'], weak: ['약함', 'bg-gray-100 text-gray-500'] };
  const [label, cls] = map[strength] || ['알 수 없음', 'bg-gray-100 text-gray-500'];
  return `<span class="text-xs px-2 py-0.5 rounded-full font-medium ${cls}">${label}</span>`;
}

function sentimentBadge(v) {
  const map = { '긍정': 'bg-green-100 text-green-700', '부정': 'bg-red-100 text-red-600', '중립': 'bg-gray-100 text-gray-500' };
  return `<span class="text-xs px-2 py-0.5 rounded-full font-medium ${map[v] || 'bg-gray-100 text-gray-500'}">${v}</span>`;
}

function card(title, icon, content) {
  return `
    <div class="bg-white rounded-2xl border border-[#e8eaf0] shadow-sm overflow-hidden">
      <div class="flex items-center gap-2 px-5 py-4 border-b border-[#f0f1f4]">
        <span class="material-symbols-outlined text-primary text-xl">${icon}</span>
        <h2 class="text-base font-bold text-[#111318]">${title}</h2>
      </div>
      <div class="px-5 py-4">${content}</div>
    </div>
  `;
}

function renderRatingsChart(distribution) {
  const total = Object.values(distribution).reduce((s, v) => s + v, 0);
  if (total === 0) return '<p class="text-sm text-[#636e88]">데이터 없음</p>';
  const rows = [5, 4, 3, 2, 1].map(star => {
    const count = distribution[star] || 0;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return `
      <div class="flex items-center gap-3">
        <span class="text-sm text-[#636e88] w-4 shrink-0">${star}</span>
        <span class="material-symbols-outlined text-yellow-400 text-base" style="font-variation-settings:'FILL' 1">star</span>
        <div class="flex-1 bg-[#f0f1f4] rounded-full h-2">
          <div class="bg-yellow-400 h-2 rounded-full" style="width:${pct}%"></div>
        </div>
        <span class="text-xs text-[#636e88] w-8 text-right">${pct}%</span>
      </div>
    `;
  }).join('');
  return `<div class="flex flex-col gap-2">${rows}</div>`;
}

function renderDetail(analysis, data) {
  // Header
  const iconUrl = analysis.app_icon_url || data.appIconUrl || '';
  const headerEl = document.getElementById('detail-header');
  headerEl.innerHTML = `
    ${iconUrl
      ? `<img src="${iconUrl}" alt="${analysis.app_identifier}" class="w-16 h-16 rounded-2xl object-cover shrink-0" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : ''}
    <div class="${iconUrl ? 'hidden' : 'flex'} w-16 h-16 rounded-2xl bg-primary items-center justify-center text-white font-bold text-2xl shrink-0">${(analysis.app_identifier || '?')[0].toUpperCase()}</div>
    <div class="flex-1 min-w-0">
      <h1 class="text-xl font-bold text-[#111318] truncate">${data.appName || analysis.app_identifier}</h1>
      <p class="text-sm text-[#636e88] mt-1">${formatDate(analysis.created_at)}</p>
    </div>
  `;

  const sections = [];

  // 핵심 가치
  if (data.coreValue) {
    sections.push(card('핵심 가치', 'lightbulb', `
      <p class="text-base font-bold text-primary mb-2">${data.coreValue.statement || ''}</p>
      <p class="text-sm text-[#444c5e] leading-relaxed">${data.coreValue.detail || ''}</p>
    `));
  }

  // 시장 정의
  if (data.market?.definition) {
    const { tam, sam } = data.market.definition;
    sections.push(card('시장 정의', 'bar_chart', `
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-[#f8f9ff] rounded-xl p-4">
          <p class="text-xs text-[#636e88] font-medium mb-1">TAM (전체시장)</p>
          <p class="text-base font-bold text-[#111318]">${tam?.size || '-'}</p>
          <p class="text-xs text-[#636e88] mt-1 leading-relaxed">${tam?.description || ''}</p>
        </div>
        <div class="bg-[#f8f9ff] rounded-xl p-4">
          <p class="text-xs text-[#636e88] font-medium mb-1">SAM (유효시장)</p>
          <p class="text-base font-bold text-[#111318]">${sam?.size || '-'}</p>
          <p class="text-xs text-[#636e88] mt-1 leading-relaxed">${sam?.description || ''}</p>
        </div>
      </div>
    `));
  }

  // 핵심 기능
  if (data.coreFeatures?.length) {
    const rows = data.coreFeatures.map(f => `
      <div class="flex items-start justify-between gap-3 py-2.5 border-b border-[#f0f1f4] last:border-0">
        <p class="text-sm text-[#111318] leading-relaxed flex-1">${f.feature}</p>
        ${sentimentBadge(f.recognizedByUsers)}
      </div>
    `).join('');
    sections.push(card('핵심 기능', 'extension', `<div class="flex flex-col">${rows}</div>`));
  }

  // 미해결 문제
  if (data.unresolvedProblems?.length) {
    const rows = data.unresolvedProblems.map(p => `
      <div class="p-3.5 bg-[#fff8f8] rounded-xl border border-red-100 mb-2 last:mb-0">
        <div class="flex items-start justify-between gap-2 mb-1">
          <p class="text-sm font-semibold text-[#111318]">${p.problem}</p>
          ${signalBadge(p.signalStrength)}
        </div>
        <p class="text-xs text-[#636e88] leading-relaxed">${p.description}</p>
      </div>
    `).join('');
    sections.push(card('미해결 문제', 'error_outline', rows));
  }

  // 평점 분포
  if (data.ratings?.distribution) {
    sections.push(card('평점 분포', 'star', renderRatingsChart(data.ratings.distribution)));
  }

  // 불만 사항
  if (data.complaints) {
    const { uiUx, performance, stability } = data.complaints;
    const tabs = [
      { label: 'UI/UX', data: uiUx },
      { label: '성능', data: performance },
      { label: '안정성', data: stability },
    ].filter(t => t.data);

    const content = tabs.map(t => `
      <div class="mb-4 last:mb-0">
        <p class="text-xs font-semibold text-[#636e88] uppercase tracking-wide mb-2">${t.label}</p>
        <p class="text-sm text-[#444c5e] mb-2 leading-relaxed">${t.data.description || ''}</p>
        <ul class="flex flex-col gap-1">
          ${(t.data.items || []).map(i => `<li class="flex items-start gap-2 text-sm text-[#111318]"><span class="text-red-400 shrink-0 mt-0.5">•</span>${i}</li>`).join('')}
        </ul>
      </div>
    `).join('');
    sections.push(card('불만 사항', 'sentiment_dissatisfied', content));
  }

  // 전략 제안
  if (data.strategySuggestion) {
    sections.push(card('전략 제안', 'rocket_launch', `
      <p class="text-base font-bold text-primary mb-3">${data.strategySuggestion.oneLine || ''}</p>
      <p class="text-sm text-[#444c5e] leading-relaxed">${data.strategySuggestion.reasoning || ''}</p>
    `));
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
}

init();
