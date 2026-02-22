/**
 * 공통 헤더 컴포넌트
 * @param {Object} options
 * @param {'index' | 'analysis' | 'pricing' | 'blog'} options.page - 현재 페이지
 * @param {string} options.apiBaseUrl - API base URL
 */
export async function initHeader({ page, apiBaseUrl }) {
  const headerEl = document.getElementById('app-header');
  if (!headerEl) return;

  // 1. 헤더를 로그아웃 상태로 즉시 렌더 (레이아웃 안정)
  headerEl.innerHTML = buildHeaderHTML({ page });
  attachMobileMenuHandlers();
  if (page === 'analysis' && apiBaseUrl) initHeaderSearch(apiBaseUrl);

  // 2. 토큰 처리 (URL에서 auth_token 수신 → localStorage 저장)
  const { handleTokenFromURL, fetchCurrentUser, logout } = await import('./auth.js');
  handleTokenFromURL();

  // 3. 현재 사용자 비동기 조회 → 로그인 UI 업데이트
  const user = apiBaseUrl ? await fetchCurrentUser(apiBaseUrl) : null;
  updateAuthUI(user);

  // 이벤트 위임: 로그인 / 로그아웃 / 프로필 드롭다운
  headerEl.addEventListener('click', (e) => {
    const loginBtn = e.target.closest('[data-action="login"]');
    const logoutBtn = e.target.closest('[data-action="logout"]');
    const profileBtn = e.target.closest('[data-action="profile"]');

    if (loginBtn) {
      window.location.href = `${apiBaseUrl}/api/auth/google`;
    }

    if (logoutBtn) {
      if (window.confirm('로그아웃 하시겠습니까?')) {
        logout();
        updateAuthUI(null);
      }
    }

    if (profileBtn) {
      const dropdown = document.getElementById('profile-dropdown');
      if (dropdown) dropdown.classList.toggle('hidden');
    }
  });

  // 프로필 드롭다운 외부 클릭 시 닫기
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('profile-dropdown');
    const container = document.getElementById('profile-menu-container');
    if (dropdown && container && !container.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });
}

/**
 * 로그인/로그아웃 UI 영역만 업데이트
 */
function updateAuthUI(user) {
  const desktopArea = document.getElementById('desktop-auth-area');
  const mobileArea = document.getElementById('mobile-auth-area');

  if (desktopArea) desktopArea.innerHTML = buildDesktopAuth(user);
  if (mobileArea) mobileArea.innerHTML = buildMobileAuth(user);
}

function buildDesktopAuth(user) {
  if (user) {
    const initial = (user.name || user.email || '?')[0].toUpperCase();
    const credit = user.credit_balance ?? 0;
    return `
      <div id="profile-menu-container" class="relative max-md:hidden">
        <!-- 프로필 버튼 -->
        <button data-action="profile" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0f1f4] hover:bg-gray-200 transition-all cursor-pointer select-none">
          <div class="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">${initial}</div>
          <span class="text-xs font-medium text-[#111318] max-w-[90px] truncate">${user.name || user.email}</span>
          <span class="material-symbols-outlined text-[#636e88] text-sm leading-none">expand_more</span>
        </button>

        <!-- 드롭다운 -->
        <div id="profile-dropdown" class="hidden absolute top-[calc(100%+8px)] right-0 w-52 bg-white rounded-xl border border-[#dcdee5] shadow-xl z-50 overflow-hidden">
          <!-- 잔여 크레딧 -->
          <div class="px-4 py-3 bg-[#f8f9ff] border-b border-[#e8eaf0] flex items-center justify-between">
            <span class="text-xs text-[#636e88] font-medium">잔여 크레딧</span>
            <span class="text-sm font-black text-primary">${credit.toLocaleString()} C</span>
          </div>
          <!-- 메뉴 -->
          <div class="py-1">
            <a href="my-analyses.html" class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#111318] hover:bg-[#f0f1f4] transition-colors">
              <span class="material-symbols-outlined text-[#636e88] text-lg">analytics</span>
              분석결과
            </a>
            <a href="credit-history.html" class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#111318] hover:bg-[#f0f1f4] transition-colors">
              <span class="material-symbols-outlined text-[#636e88] text-lg">toll</span>
              크레딧 사용내역
            </a>
            <a href="payment-history.html" class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#111318] hover:bg-[#f0f1f4] transition-colors">
              <span class="material-symbols-outlined text-[#636e88] text-lg">receipt_long</span>
              결제 내역
            </a>
          </div>
          <!-- 로그아웃 -->
          <div class="border-t border-[#f0f1f4] py-1">
            <button data-action="logout" class="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
              <span class="material-symbols-outlined text-lg">logout</span>
              로그아웃
            </button>
          </div>
        </div>
      </div>
    `;
  }
  return `
    <button data-action="login" class="flex items-center gap-2 min-w-[140px] justify-center rounded-lg h-9 md:h-10 px-3 md:px-4 border border-[#dcdee5] bg-white text-[#111318] text-xs md:text-sm font-medium hover:bg-[#f0f1f4] transition-all max-md:hidden">
      <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Login with Google
    </button>
  `;
}

function buildMobileAuth(user) {
  if (user) {
    const initial = (user.name || user.email || '?')[0].toUpperCase();
    const credit = user.credit_balance ?? 0;
    return `
      <div class="border-t border-[#e5e7eb]">
        <!-- 프로필 + 잔여 크레딧 -->
        <div class="px-5 py-4 bg-[#f8f9ff] border-b border-[#e8eaf0]">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">${initial}</div>
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-bold text-[#111318] truncate">${user.name || ''}</span>
              <span class="text-xs text-[#636e88] truncate">${user.email}</span>
            </div>
          </div>
          <div class="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-[#e8eaf0]">
            <span class="text-xs text-[#636e88] font-medium">잔여 크레딧</span>
            <span class="text-sm font-black text-primary">${credit.toLocaleString()} C</span>
          </div>
        </div>
        <!-- 메뉴 링크 -->
        <div class="px-5 py-2">
          <a href="my-analyses.html" class="flex items-center gap-3 py-3 text-sm font-medium text-[#111318] border-b border-[#f0f1f4] hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-lg text-[#636e88]">analytics</span>
            분석결과
          </a>
          <a href="credit-history.html" class="flex items-center gap-3 py-3 text-sm font-medium text-[#111318] border-b border-[#f0f1f4] hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-lg text-[#636e88]">toll</span>
            크레딧 사용내역
          </a>
          <a href="payment-history.html" class="flex items-center gap-3 py-3 text-sm font-medium text-[#111318] hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-lg text-[#636e88]">receipt_long</span>
            결제 내역
          </a>
        </div>
        <!-- 로그아웃 -->
        <div class="px-5 py-3 border-t border-[#f0f1f4]">
          <button data-action="logout" class="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors">
            <span class="material-symbols-outlined text-lg">logout</span>
            로그아웃
          </button>
        </div>
      </div>
    `;
  }
  return `
    <div class="px-5 py-4 border-t border-[#e5e7eb]">
      <button data-action="login" class="w-full flex items-center justify-center gap-2 rounded-lg h-11 px-4 border border-[#dcdee5] bg-white text-[#111318] text-sm font-medium hover:bg-[#f0f1f4] transition-all">
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
}

function buildHeaderHTML({ page }) {
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

  const desktopNavLinks = buildDesktopNavLinks({ page });

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

  const mobileDrawerContent = buildMobileDrawer({ page });

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
          <!-- 로그인/프로필 영역 (updateAuthUI로 채워짐) -->
          <div id="desktop-auth-area" class="max-md:hidden">
            <!-- 로딩 중 placeholder -->
            <div class="w-[140px] h-9 rounded-lg bg-[#f0f1f4] animate-pulse"></div>
          </div>
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

function attachMobileMenuHandlers() {
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
}

function buildDesktopNavLinks({ page }) {
  const base = 'text-sm font-medium leading-normal transition-colors';
  const active = 'text-primary font-bold border-b-2 border-primary pb-0.5';
  const inactive = 'text-[#111318] hover:text-primary';

  const links = [];
  links.push(`<a class="${base} ${inactive}" href="#">서비스</a>`);
  links.push(`<a class="${base} ${page === 'pricing' ? active : inactive}" href="pricing.html">이용 플랜</a>`);
  links.push(`<a class="${base} ${page === 'blog' ? active : inactive}" href="blog.html">블로그</a>`);
  return links.join('');
}

function buildMobileDrawer({ page }) {
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
      <a href="pricing.html" class="flex items-center gap-3 py-4 text-sm font-medium ${page === 'pricing' ? 'text-primary font-bold' : 'text-[#111318]'} border-b border-[#f0f1f4] hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-lg ${page === 'pricing' ? 'text-primary' : ''}">credit_card</span>
        이용 플랜
      </a>
      <a href="blog.html" class="flex items-center gap-3 py-4 text-sm font-medium ${page === 'blog' ? 'text-primary font-bold' : 'text-[#111318]'} border-b border-[#f0f1f4] hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-lg ${page === 'blog' ? 'text-primary' : ''}">article</span>
        블로그
      </a>
    </nav>
  `;

  // 모바일 auth 영역은 updateAuthUI가 채움
  const mobileAuthPlaceholder = `<div id="mobile-auth-area"></div>`;

  return drawerLogoHTML + mobileSearchHTML + mobileNavLinks + mobileAuthPlaceholder;
}

/**
 * analysis 페이지 헤더 검색창 기능 초기화
 */
function initHeaderSearch(apiBaseUrl) {
  let debounceTimer;

  const headerInput = document.getElementById('header-search-input');
  const headerDropdown = document.getElementById('header-search-dropdown');
  const headerDropdownItems = document.getElementById('header-dropdown-items');
  const headerSearchSection = document.getElementById('header-search-section');

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

    input.addEventListener('focus', () => {
      if (input.value.trim().length >= 2 && dropdownItems.children.length > 0) {
        dropdown.classList.remove('hidden');
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
