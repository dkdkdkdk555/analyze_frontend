/**
 * 공통 헤더 컴포넌트
 * @param {Object} options
 * @param {'index' | 'analysis'} options.page - 현재 페이지
 * @param {string} options.apiBaseUrl - API base URL (analysis 페이지의 검색 기능에 필요)
 */
export function initHeader({ page, apiBaseUrl }) {
  // 로그인 상태 (추후 실제 인증으로 교체)
  const isLoggedIn = false;

  const headerEl = document.getElementById('app-header');
  if (!headerEl) return;

  headerEl.innerHTML = buildHeaderHTML({ page, isLoggedIn });

  // 모바일 메뉴 토글
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
  const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');
  const mobileMenuClose = document.getElementById('mobile-menu-close');

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

  // analysis 페이지: 헤더 검색창 초기화
  if (page === 'analysis' && apiBaseUrl) {
    initHeaderSearch(apiBaseUrl);
  }
}

function buildHeaderHTML({ page, isLoggedIn }) {
  const logoHTML = `
    <a href="index.html" class="flex items-center gap-2 md:gap-3 text-primary shrink-0">
      <div class="size-5 md:size-6">
        <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z" fill="currentColor"></path>
        </svg>
      </div>
      <span class="text-[#111318] font-black text-base md:text-lg tracking-tight">분석드가?</span>
    </a>
  `;

  // 데스크탑 nav 링크
  const desktopNavLinks = buildDesktopNavLinks({ page, isLoggedIn });

  // 데스크탑 우측 액션 (검색폼 + 인증 버튼)
  const desktopSearchHTML = page === 'analysis' ? `
    <div id="header-search-section" class="relative max-w-[320px] w-full max-md:hidden">
      <div class="flex items-center h-9 md:h-10 rounded-lg bg-[#f0f1f4] px-3 focus-within:ring-2 focus-within:ring-primary focus-within:bg-white transition-all">
        <span class="material-symbols-outlined text-[#636e88] text-lg mr-2">search</span>
        <input
          id="header-search-input"
          class="flex-1 bg-transparent border-none text-sm text-[#111318] placeholder:text-[#636e88] focus:outline-none focus:ring-0"
          placeholder="다른 앱 분석하기"
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

  const desktopAuthHTML = isLoggedIn ? `
    <button class="flex items-center justify-center w-9 h-9 rounded-full bg-[#f0f1f4] hover:bg-gray-200 transition-all overflow-hidden max-md:hidden" aria-label="프로필">
      <span class="material-symbols-outlined text-[#111318] text-xl">account_circle</span>
    </button>
  ` : `
    <button class="flex items-center gap-2 min-w-[140px] justify-center rounded-lg h-9 md:h-10 px-3 md:px-4 border border-[#dcdee5] bg-white text-[#111318] text-xs md:text-sm font-medium hover:bg-[#f0f1f4] transition-all max-md:hidden">
      <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Login with Google
    </button>
  `;

  // 모바일 메뉴 드로어 내용
  const mobileDrawerContent = buildMobileDrawer({ page, isLoggedIn });

  return `
    <!-- Top Navigation Bar -->
    <header class="sticky top-0 z-50 w-full bg-white border-b border-solid border-[#e5e7eb] px-4 sm:px-6 md:px-10 lg:px-20 xl:px-[100px] py-3">
      <div class="flex items-center justify-between gap-3 max-w-[1200px] mx-auto">
        ${logoHTML}
        <div class="flex flex-1 items-center justify-end gap-2 md:gap-3">
          ${desktopSearchHTML}
          <nav class="flex items-center gap-4 lg:gap-6 max-md:hidden">
            ${desktopNavLinks}
          </nav>
          ${desktopAuthHTML}
          <!-- Hamburger (mobile) -->
          <button id="mobile-menu-btn" class="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[#f0f1f4] transition-colors" aria-label="메뉴 열기">
            <span class="material-symbols-outlined text-[#111318]">menu</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile Menu Overlay -->
    <div id="mobile-menu-overlay" class="fixed inset-0 bg-black/40 z-[60] hidden opacity-0 transition-opacity duration-300 md:hidden"></div>

    <!-- Mobile Menu Drawer -->
    <div id="mobile-menu-drawer" class="fixed top-0 right-0 h-full w-[85vw] max-w-[320px] bg-white z-[70] translate-x-full transition-transform duration-300 ease-in-out flex flex-col shadow-2xl md:hidden">
      ${mobileDrawerContent}
    </div>
  `;
}

function buildDesktopNavLinks({ page }) {
  const base = 'text-sm font-medium leading-normal transition-colors';
  const active = 'text-primary font-bold border-b-2 border-primary pb-0.5';
  const inactive = 'text-[#111318] hover:text-primary';

  const links = [];

  links.push(`<a class="${base} ${inactive}" href="#">서비스</a>`);
  links.push(`<a class="${base} ${inactive}" href="#">이용 플랜</a>`);
  links.push(`<a class="${base} ${page === 'blog' ? active : inactive}" href="blog.html">블로그</a>`);

  return links.join('');
}

function buildMobileDrawer({ page, isLoggedIn }) {
  const drawerLogoHTML = `
    <div class="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
      <a href="index.html" class="flex items-center gap-2 text-primary">
        <div class="size-5">
          <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z" fill="currentColor"></path>
          </svg>
        </div>
        <span class="text-[#111318] font-black text-base tracking-tight">분석드가?</span>
      </a>
      <button id="mobile-menu-close" class="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[#f0f1f4] transition-colors" aria-label="메뉴 닫기">
        <span class="material-symbols-outlined text-[#111318]">close</span>
      </button>
    </div>
  `;

  // analysis 페이지에서만 모바일 검색창 표시
  const mobileSearchHTML = page === 'analysis' ? `
    <div class="px-5 py-4 border-b border-[#e5e7eb]">
      <p class="text-xs font-semibold text-[#636e88] mb-2 uppercase tracking-wider">다른 앱 분석하기</p>
      <div id="mobile-search-section" class="relative">
        <div class="flex items-center h-10 rounded-lg bg-[#f0f1f4] px-3 focus-within:ring-2 focus-within:ring-primary focus-within:bg-white transition-all">
          <span class="material-symbols-outlined text-[#636e88] text-lg mr-2">search</span>
          <input
            id="mobile-search-input"
            class="flex-1 bg-transparent border-none text-sm text-[#111318] placeholder:text-[#636e88] focus:outline-none focus:ring-0"
            placeholder="앱 이름 검색"
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
      <a href="#" class="flex items-center gap-3 py-4 text-sm font-medium text-[#111318] border-b border-[#f0f1f4] hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-lg">apps</span>
        서비스
      </a>
      ${isLoggedIn ? `
      <a href="#" class="flex items-center gap-3 py-4 text-sm font-medium text-[#111318] border-b border-[#f0f1f4] hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-lg">credit_card</span>
        플랜
      </a>
      ` : ''}
      <a href="blog.html" class="flex items-center gap-3 py-4 text-sm font-medium ${page === 'blog' ? 'text-primary font-bold' : 'text-[#111318]'} ${isLoggedIn ? '' : 'border-b border-[#f0f1f4]'} hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-lg ${page === 'blog' ? 'text-primary' : ''}">article</span>
        블로그
      </a>
    </nav>
  `;

  const mobileAuthHTML = isLoggedIn ? `
    <div class="px-5 py-4 border-t border-[#e5e7eb]">
      <div class="flex items-center gap-3">
        <span class="material-symbols-outlined text-3xl text-[#636e88]">account_circle</span>
        <span class="text-sm font-medium text-[#111318]">내 계정</span>
      </div>
    </div>
  ` : `
    <div class="px-5 py-4 border-t border-[#e5e7eb]">
      <button class="w-full flex items-center justify-center gap-2 rounded-lg h-11 px-4 border border-[#dcdee5] bg-white text-[#111318] text-sm font-medium hover:bg-[#f0f1f4] transition-all">
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

  return drawerLogoHTML + mobileSearchHTML + mobileNavLinks + mobileAuthHTML;
}

/**
 * analysis 페이지 헤더 검색창 기능 초기화
 */
function initHeaderSearch(apiBaseUrl) {
  let debounceTimer;

  // 데스크탑 헤더 검색
  const headerInput = document.getElementById('header-search-input');
  const headerDropdown = document.getElementById('header-search-dropdown');
  const headerDropdownItems = document.getElementById('header-dropdown-items');
  const headerSearchSection = document.getElementById('header-search-section');

  // 모바일 검색
  const mobileInput = document.getElementById('mobile-search-input');
  const mobileDropdown = document.getElementById('mobile-search-dropdown');
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
        검색 중...
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
    } catch { return []; }
  }

  async function searchPlayStore(apiBaseUrl, query) {
    try {
      const response = await fetch(`${apiBaseUrl}/api/apps/search?query=${encodeURIComponent(query)}`);
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
      dropdownItems.innerHTML = `<div class="flex items-center justify-center p-4 text-[#636e88] text-sm">검색 결과가 없습니다</div>`;
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
        if (app.appStoreUrl) params.set('appStoreUrl', app.appStoreUrl);
        if (app.playStoreUrl) params.set('playStoreUrl', app.playStoreUrl);
        if (app.appName) params.set('appName', app.appName);
        if (app.iconImageUrl) params.set('iconUrl', app.iconImageUrl);
        if (app.developer) params.set('developer', app.developer);
        window.location.href = `/analysis.html?${params.toString()}`;
      });
    });
  }
}
