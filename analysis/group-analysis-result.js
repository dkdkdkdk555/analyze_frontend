import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { getLang, t, applyTranslations } from '../components/i18n.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';

// Color palette for apps in positioning map
const APP_COLORS = ['#1E5AE8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Track preview/limited mode (data not saved, some sections locked)
let isPreviewMode = false;

async function init() {
  applyTranslations();

  const params = new URLSearchParams(location.search);
  isPreviewMode = params.get('preview') === 'true';

  // Update OG/Twitter meta tags and html lang based on active language
  const lang = getLang();
  const isKo = lang === 'ko';
  const ogTitle = isKo ? '그룹 분석 결과 - TalonInsight' : 'Group Analysis Results - TalonInsight';
  const ogDesc = isKo
    ? '여러 앱의 경쟁 구도와 시장 기회를 한눈에 확인하세요.'
    : 'See the competitive landscape and market opportunities across multiple apps at a glance.';
  const ogLocale = isKo ? 'ko_KR' : 'en_US';
  document.documentElement.lang = lang;
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', ogTitle);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', ogDesc);
  document.querySelector('meta[property="og:locale"]')?.setAttribute('content', ogLocale);
  document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', ogTitle);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', ogDesc);
  document.querySelector('meta[name="description"]')?.setAttribute('content', ogDesc);

  await initHeader({ page: 'index', apiBaseUrl: API_BASE_URL });
  initFooter();

  const id = params.get('id');
  if (!id || id === 'undefined' || id === 'null') {
    showError();
    return;
  }

  try {
    // D1 복제 지연 대비: 404 응답 시 최대 3회 재시도 (1s 간격)
    let res = null;
    for (let attempt = 0; attempt <= 3; attempt++) {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      res = await fetch(`${API_BASE_URL}/api/groups/${id}`);
      if (res.ok || res.status !== 404) break;
    }
    if (!res.ok) { showError(); return; }

    const data = await res.json();
    if (!data.result) { showError(); return; }

    renderResult(data);
  } catch {
    showError();
  }
}

function showError() {
  document.getElementById('loading-view').classList.add('hidden');
  document.getElementById('error-view').classList.remove('hidden');
}

async function renderResult(data) {
  document.getElementById('loading-view').classList.add('hidden');
  document.getElementById('results-view').classList.remove('hidden');

  const { name, apps, result, created_at } = data;

  // Header
  document.getElementById('breadcrumb-group-name').textContent = name;
  document.getElementById('group-name-title').textContent = name;

  // App chips
  const chipsEl = document.getElementById('app-chips');
  chipsEl.innerHTML = apps.map(app => {
    const iconHtml = app.iconUrl
      ? `<img src="${app.iconUrl}" alt="${app.appName}" class="w-5 h-5 rounded object-cover">`
      : `<div class="w-5 h-5 rounded bg-primary flex items-center justify-center text-white text-xs font-bold">${(app.appName || '?')[0]}</div>`;
    return `<span class="flex items-center gap-1.5 bg-background-light border border-[#e5e7eb] rounded-full px-3 py-1 text-xs font-medium text-[#111318]">
      ${iconHtml}${app.appName}
    </span>`;
  }).join('');

  // Meta
  const locale = getLang() === 'en' ? 'en-US' : 'ko-KR';
  const date = created_at ? new Date(created_at).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  document.getElementById('group-meta').textContent = getLang() === 'en'
    ? `Analyzed: ${date} · ${apps.length} apps`
    : `분석일: ${date} · 앱 ${apps.length}개`;

  // Verdict
  document.getElementById('verdict-statement').textContent = result.verdict?.statement || '';
  document.getElementById('verdict-reasoning').textContent = result.verdict?.reasoning || '';

  // Positioning Map
  await renderPositioningMap(result.positioningMap, apps);

  // Pain Points
  renderPainPoints(result.commonPainPoints || []);

  // Market Share
  renderMarketShare(result.marketShare || [], result.marketShareInsight || '');

  // Entry Opportunity (null이면 잠금 또는 없음)
  renderEntryOpportunity(result.entryOpportunity);

  // Entry Risks (null이면 잠금, []이면 없음 메시지)
  renderEntryRisks(result.entryRisks);

  // Individual Apps
  renderIndividualApps(apps);

  // Apply locked notice for preview/limited mode
  if (isPreviewMode) {
    showPreviewNoticeBanner();
  }
}

// ── Preview/Limited Mode Notice ────────────────────────────────────────────────
function showPreviewNoticeBanner() {
  const isKo = getLang() === 'ko';
  const isLoggedIn = !!localStorage.getItem('auth_token');
  const banner = document.createElement('div');
  banner.className = 'fixed top-16 left-0 right-0 bg-amber-50 border-b border-amber-200 px-4 py-3 z-40 flex items-center justify-center gap-3';

  let ctaHtml;
  if (isLoggedIn) {
    ctaHtml = `<a href="/mypage/credits.html" class="shrink-0 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors">
      ${isKo ? '크레딧 충전' : 'Add Credits'}
    </a>`;
  } else {
    ctaHtml = `<a href="/?signup=true" class="shrink-0 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors">
      ${isKo ? '무료 가입' : 'Sign Up Free'}
    </a>`;
  }

  banner.innerHTML = `
    <span class="material-symbols-outlined text-amber-500" style="font-size:20px">lock</span>
    <p class="text-sm text-amber-700">${isKo ? '일부 분석 결과가 잠겨 있습니다. 이 결과는 저장되지 않습니다.' : 'Some results are locked. This analysis is not saved.'}</p>
    ${ctaHtml}
  `;
  document.body.appendChild(banner);
  document.body.style.paddingTop = '52px';
}

// ── Locked Section Placeholder ────────────────────────────────────────────────
function renderLockedSection() {
  const isKo = getLang() === 'ko';
  const isLoggedIn = !!localStorage.getItem('auth_token');
  const ctaHref = isLoggedIn ? '/mypage/credits.html' : '/?signup=true';
  const ctaText = isLoggedIn
    ? (isKo ? '크레딧 충전하기' : 'Add Credits')
    : (isKo ? '무료로 시작하기' : 'Get Started Free');
  const descText = isLoggedIn
    ? (isKo ? '크레딧으로 전체 분석 결과를 확인하세요' : 'Use credits to access the complete analysis')
    : (isKo ? '가입 후 크레딧으로 전체 분석 결과를 확인하세요' : 'Sign up and use credits to access the complete analysis');

  return `
    <div class="flex flex-col items-center justify-center py-10 gap-3 text-center">
      <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <span class="material-symbols-outlined text-primary" style="font-size:24px">lock</span>
      </div>
      <p class="text-sm font-bold text-[#111318]">${isKo ? '전체 내용을 보려면 잠금을 해제하세요' : 'Unlock to view full insights'}</p>
      <p class="text-xs text-[#636e88]">${descText}</p>
      <a href="${ctaHref}" class="mt-1 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors">
        ${ctaText}
      </a>
    </div>
  `;
}

// ── Positioning Map ──────────────────────────────────────────────────────────
async function renderPositioningMap(posMap, apps) {
  if (!posMap) return;

  const canvas = document.getElementById('positioning-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const PAD = 60;
  const r = 18;

  const appPositions = posMap.apps || [];

  // Pre-load app icons (match by appName)
  const iconImages = await Promise.all(
    appPositions.map(appPos => {
      const appData = apps.find(a => a.appName === appPos.appName);
      const iconUrl = appData?.iconUrl;
      if (!iconUrl) return Promise.resolve(null);
      return new Promise(resolve => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = iconUrl;
      });
    })
  );

  // Background
  ctx.fillStyle = '#f8f9fc';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(W / 2, PAD); ctx.lineTo(W / 2, H - PAD);
  ctx.moveTo(PAD, H / 2); ctx.lineTo(W - PAD, H / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Axis labels (all horizontal)
  ctx.fillStyle = '#6b7280';
  ctx.font = '11px Noto Sans KR, sans-serif';

  // X axis
  ctx.textAlign = 'center';
  ctx.fillText(posMap.xAxis?.low || '', PAD, H / 2 + 16);
  ctx.fillText(posMap.xAxis?.high || '', W - PAD, H / 2 + 16);
  ctx.fillText(posMap.xAxis?.label || '', W / 2, H - 8);

  // Y axis (horizontal labels — no rotation)
  ctx.textAlign = 'center';
  ctx.fillText(posMap.yAxis?.label || '', W / 2, 14);
  ctx.textAlign = 'left';
  ctx.fillText(posMap.yAxis?.high || '', PAD + 8, PAD + 12);
  ctx.fillText(posMap.yAxis?.low || '', PAD + 8, H - PAD - 4);

  // Convert -100~100 to canvas coords
  const toX = v => PAD + ((v + 100) / 200) * (W - PAD * 2);
  const toY = v => H - PAD - ((v + 100) / 200) * (H - PAD * 2);

  // Opportunity Zone
  if (posMap.opportunityZone) {
    const oz = posMap.opportunityZone;
    const ox = toX(oz.x || 0);
    const oy = toY(oz.y || 0);

    ctx.beginPath();
    ctx.arc(ox, oy, 30, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30, 90, 232, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(30, 90, 232, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#1E5AE8';
    ctx.font = 'bold 10px Noto Sans KR, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`💡 ${t('group_result.opportunity_label')}`, ox, oy + 3);
  }

  // App dots (icon circles or colored fallback)
  appPositions.forEach((appPos, i) => {
    const x = toX(appPos.x || 0);
    const y = toY(appPos.y || 0);
    const color = APP_COLORS[i % APP_COLORS.length];
    const img = iconImages[i];

    if (img) {
      // Circular clipped icon
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
      ctx.restore();

      // White inner border
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Colored outer ring
      ctx.beginPath();
      ctx.arc(x, y, r + 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Fallback: colored circle
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

  });

  // ── Collision-aware label placement ────────────────────────────────────────
  ctx.font = '11px Noto Sans KR, sans-serif';
  const FONT_H = 12;
  const LABEL_PAD_X = 4;
  const LABEL_PAD_Y = 2;

  // Measure each label
  const labelMeta = appPositions.map((appPos, i) => {
    const text = appPos.appName?.slice(0, 8) || '';
    const tw = ctx.measureText(text).width;
    return { text, tw, x: toX(appPos.x || 0), y: toY(appPos.y || 0) };
  });

  // Candidate offsets: below, above, right, left, below-right, below-left, above-right, above-left
  const OFFSETS = [
    { dx: 0,    dy: r + 14 },
    { dx: 0,    dy: -(r + 6) },
    { dx: r + 8, dy: 4 },
    { dx: -(r + 8), dy: 4 },
    { dx: r + 6,  dy: r + 10 },
    { dx: -(r + 6), dy: r + 10 },
    { dx: r + 6,  dy: -(r + 6) },
    { dx: -(r + 6), dy: -(r + 6) },
  ];

  // Check AABB overlap of two label rects
  function overlaps(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  // Track placed label rects
  const placed = [];

  const finalLabels = labelMeta.map(({ text, tw, x, y }) => {
    const lw = tw + LABEL_PAD_X * 2;
    const lh = FONT_H + LABEL_PAD_Y * 2;

    for (const { dx, dy } of OFFSETS) {
      const lx = x + dx - lw / 2;
      const ly = y + dy - lh / 2;

      // Stay within canvas bounds
      if (lx < 2 || lx + lw > W - 2 || ly < 2 || ly + lh > H - 2) continue;

      // Check against already-placed labels
      const hasOverlap = placed.some(p => overlaps(lx, ly, lw, lh, p.lx, p.ly, p.lw, p.lh));
      if (!hasOverlap) {
        placed.push({ lx, ly, lw, lh });
        return { text, lx, ly, lw, lh, cx: x + dx, cy: y + dy };
      }
    }

    // Fallback: use first candidate even if overlapping
    const { dx, dy } = OFFSETS[0];
    const lx = x + dx - lw / 2;
    const ly = y + dy - lh / 2;
    placed.push({ lx, ly, lw, lh });
    return { text, lx, ly, lw, lh, cx: x + dx, cy: y + dy };
  });

  // Draw labels with white background pill
  finalLabels.forEach(({ text, lx, ly, lw, lh, cx, cy }) => {
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(lx, ly, lw, lh, 4);
    } else {
      ctx.rect(lx, ly, lw, lh);
    }
    ctx.fill();

    ctx.fillStyle = '#111318';
    ctx.textAlign = 'center';
    ctx.fillText(text, cx, cy + FONT_H / 2 - 1);
  });

  // Legend
  const legendEl = document.getElementById('positioning-legend');
  legendEl.innerHTML = appPositions.map((app, i) => {
    const color = APP_COLORS[i % APP_COLORS.length];
    const appData = apps.find(a => a.appName === app.appName);
    const iconHtml = appData?.iconUrl
      ? `<img src="${appData.iconUrl}" alt="${app.appName}" class="w-3 h-3 rounded-sm object-cover flex-shrink-0" onerror="this.style.display='none'">`
      : `<span class="w-3 h-3 rounded-full flex-shrink-0" style="background:${color}"></span>`;
    return `<span class="flex items-center gap-1.5 text-xs text-[#636e88]">
      ${iconHtml}
      ${app.appName}
    </span>`;
  }).join('');

  if (posMap.opportunityZone) {
    legendEl.innerHTML += `<span class="flex items-center gap-1.5 text-xs text-primary">
      <span class="w-3 h-3 rounded-full border border-primary flex-shrink-0" style="background:rgba(30,90,232,0.1)"></span>
      💡 ${posMap.opportunityZone.label || t('group_result.opportunity_area')}
    </span>`;
  }
}

// ── Pain Points ───────────────────────────────────────────────────────────────
function renderPainPoints(painPoints) {
  const el = document.getElementById('pain-points-section');
  if (!painPoints.length) {
    el.innerHTML = `<p class="text-sm text-[#636e88]">${t('group_result.pain_points_none')}</p>`;
    return;
  }

  const severityMap = {
    strong: { key: 'group_result.severity_strong', color: 'bg-red-100 text-red-600', dot: 'bg-red-500' },
    medium: { key: 'group_result.severity_medium', color: 'bg-yellow-100 text-yellow-600', dot: 'bg-yellow-500' },
    weak:   { key: 'group_result.severity_weak',   color: 'bg-gray-100 text-gray-500',   dot: 'bg-gray-400' },
  };

  el.innerHTML = painPoints.map(pp => {
    const sev = severityMap[pp.severity] || severityMap.medium;
    const affectedApps = (pp.affectedApps || []).join(', ');
    return `
      <div class="border border-[#e5e7eb] rounded-xl p-4">
        <div class="flex items-start gap-3">
          <span class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${sev.dot}"></span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-semibold text-sm text-[#111318]">${pp.problem}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${sev.color}">${t(sev.key)}</span>
            </div>
            <p class="text-xs text-[#636e88] leading-relaxed mb-2">${pp.description}</p>
            ${affectedApps ? `<p class="text-[11px] text-[#636e88]">${t('group_result.affected_apps')}: <span class="font-medium text-[#111318]">${affectedApps}</span></p>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── Market Share ──────────────────────────────────────────────────────────────
function renderMarketShare(marketShare, insight) {
  const el = document.getElementById('market-share-section');

  el.innerHTML = marketShare.map((item, i) => {
    const color = APP_COLORS[i % APP_COLORS.length];
    return `
      <div>
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm font-semibold text-[#111318]">${item.appName}</span>
          <span class="text-sm font-bold" style="color:${color}">${item.share}%</span>
        </div>
        <div class="h-2 bg-[#f0f1f4] rounded-full overflow-hidden mb-1">
          <div class="h-full rounded-full transition-all duration-700" style="width:${item.share}%;background:${color}"></div>
        </div>
        <p class="text-xs text-[#636e88]">${item.insight}</p>
      </div>`;
  }).join('');

  document.getElementById('market-share-insight').textContent = insight;
}

// ── Entry Opportunity ─────────────────────────────────────────────────────────
function renderEntryOpportunity(opportunity) {
  const el = document.getElementById('entry-opportunity-section');
  if (opportunity === null && isPreviewMode) {
    // 제한 모드: 데이터가 서버에서 제공되지 않음 (개발자도구로도 볼 수 없음)
    el.innerHTML = renderLockedSection();
    return;
  }
  if (!opportunity) {
    el.innerHTML = `<p class="text-sm text-[#636e88]">${t('group_result.opportunity_none')}</p>`;
    return;
  }

  const tags = (opportunity.tags || []).map(tag =>
    `<span class="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">${tag}</span>`
  ).join('');

  el.innerHTML = `
    <div class="border-l-4 border-primary pl-4 mb-4">
      <h3 class="text-base font-bold text-[#111318] mb-2">${opportunity.title || ''}</h3>
      <p class="text-sm text-[#636e88] leading-relaxed">${opportunity.description || ''}</p>
    </div>
    ${tags ? `<div class="flex flex-wrap gap-2">${tags}</div>` : ''}
  `;
}

// ── Entry Risks ───────────────────────────────────────────────────────────────
function renderEntryRisks(risks) {
  const el = document.getElementById('entry-risks-section');
  if (risks === null && isPreviewMode) {
    // 제한 모드: 데이터가 서버에서 제공되지 않음 (개발자도구로도 볼 수 없음)
    el.innerHTML = renderLockedSection();
    return;
  }
  if (!risks || !risks.length) {
    el.innerHTML = `<p class="text-sm text-[#636e88]">${t('group_result.risks_none')}</p>`;
    return;
  }

  const sevColors = {
    HIGH:   { bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-600',       key: 'group_result.severity_high' },
    MEDIUM: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-600', key: 'group_result.severity_mid' },
    LOW:    { bg: 'bg-gray-50',   border: 'border-gray-200',   badge: 'bg-gray-100 text-gray-500',     key: 'group_result.severity_low' },
  };

  el.innerHTML = risks.map(risk => {
    const sev = sevColors[risk.severity] || sevColors.MEDIUM;
    return `
      <div class="${sev.bg} border ${sev.border} rounded-xl p-4">
        <div class="flex items-start justify-between gap-2 mb-2">
          <p class="text-sm font-bold text-[#111318]">${risk.risk}</p>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${sev.badge}">${t(sev.key)}</span>
        </div>
        <p class="text-xs text-[#636e88] leading-relaxed">${risk.description}</p>
      </div>`;
  }).join('');
}

// ── Individual Apps ───────────────────────────────────────────────────────────
function renderIndividualApps(apps) {
  const el = document.getElementById('individual-apps-section');
  const isKo = getLang() === 'ko';

  el.innerHTML = apps.map(app => {
    const iconHtml = app.iconUrl
      ? `<img src="${app.iconUrl}" alt="${app.appName}" class="w-10 h-10 rounded-xl object-cover">`
      : `<div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold">${(app.appName || '?')[0]}</div>`;

    // preview 모드에서는 개별 분석 결과 링크를 잠금 상태로 표시
    if (isPreviewMode) {
      return `
        <div class="flex items-center gap-3 p-4 bg-gray-50 border border-[#e5e7eb] rounded-xl opacity-60">
          ${iconHtml}
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-[#111318] truncate">${app.appName}</p>
            <p class="text-xs text-[#636e88] mt-0.5">${isKo ? '전체 결과를 보려면 잠금 해제하세요' : 'Unlock to view full results'}</p>
          </div>
          <span class="material-symbols-outlined text-[#636e88]" style="font-size:18px">lock</span>
        </div>`;
    }

    // Link to user analysis history using the stored userAnalysisId
    const analysisHref = app.userAnalysisId
      ? `/mypage/my-analyses.html?id=${app.userAnalysisId}`
      : '#';

    return `
      <a href="${analysisHref}" class="flex items-center gap-3 p-4 bg-white border border-[#e5e7eb] rounded-xl hover:border-primary hover:shadow-sm transition-all group">
        ${iconHtml}
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-[#111318] truncate">${app.appName}</p>
          <p class="text-xs text-[#636e88] mt-0.5">${t('group_result.individual_link')}</p>
        </div>
        <span class="material-symbols-outlined text-[#636e88] group-hover:text-primary transition-colors" style="font-size:18px">arrow_forward</span>
      </a>`;
  }).join('');
}

// 뒤로가기 시 분석중 페이지 대신 서비스 페이지로 이동
history.pushState(null, '', location.href);
window.addEventListener('popstate', () => {
  const params = new URLSearchParams(location.search);
  if (params.get('preview') === 'true') {
    location.replace('/analysis/group-analysis.html');
  } else {
    location.replace('https://taloninsight.com/services/services');
  }
});

init();
