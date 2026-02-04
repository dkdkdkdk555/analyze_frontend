let debounceTimer;

export function initSearchBar(apiBaseUrl) {
  const input = document.getElementById('search-input');
  const dropdown = document.getElementById('search-dropdown');
  const analyzeBtn = document.getElementById('analyze-btn');
  const errorMessage = document.getElementById('error-message');
  const dropdownMore = document.getElementById('dropdown-more');

  let selectedApp = null;
  let allResults = []; // 전체 검색 결과 저장
  let isExpanded = false; // 드롭다운 확장 상태
  const INITIAL_LIMIT = 5; // 초기 표시 개수

  input.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => searchApps(e.target.value), 300);
  });

  analyzeBtn.addEventListener('click', () => {
    if (selectedApp) {
      const params = new URLSearchParams();
      if (selectedApp.appStoreUrl) params.set('appStoreUrl', selectedApp.appStoreUrl);
      if (selectedApp.playStoreUrl) params.set('playStoreUrl', selectedApp.playStoreUrl);
      // 메타데이터도 전달 (백엔드에서 iTunes API 호출 실패 시 fallback으로 사용)
      if (selectedApp.appName) params.set('appName', selectedApp.appName);
      if (selectedApp.iconImageUrl) params.set('iconUrl', selectedApp.iconImageUrl);
      if (selectedApp.developer) params.set('developer', selectedApp.developer);
      window.location.href = `/analysis.html?${params.toString()}`;
    }
  });

  // "결과 더 보기" / "접기" 버튼 클릭 핸들러
  if (dropdownMore) {
    dropdownMore.addEventListener('click', (e) => {
      e.stopPropagation(); // 드롭다운 닫힘 방지
      isExpanded = !isExpanded;
      renderDropdown(allResults);
    });
  }

  async function searchApps(query) {
    if (!query || query.trim().length < 2) {
      dropdown.classList.add('hidden');
      return;
    }

    try {
      errorMessage.classList.add('hidden');

      // 새 검색 시 확장 상태 초기화
      isExpanded = false;

      // 로딩 표시
      showLoadingDropdown();

      // 병렬로 iTunes API와 백엔드 Play Store 검색 실행
      const [iTunesResults, playStoreResults] = await Promise.all([
        searchiTunes(query),
        searchPlayStore(apiBaseUrl, query),
      ]);

      // 결과 병합 (개선된 매칭 로직)
      const mergedResults = mergeSearchResults(iTunesResults, playStoreResults);

      // 전체 결과 저장
      allResults = mergedResults;

      renderDropdown(mergedResults);
    } catch (error) {
      console.error('Search error:', error);
      showError();
    }
  }

  function showLoadingDropdown() {
    const dropdownItems = document.getElementById('dropdown-items');
    const dropdownMore = document.getElementById('dropdown-more');
    dropdownItems.innerHTML = `
      <div class="flex items-center justify-center p-6 text-[#636e88]">
        <div class="w-5 h-5 border-2 border-gray-200 border-t-primary rounded-full animate-spin mr-2"></div>
        검색 중...
      </div>
    `;
    if (dropdownMore) dropdownMore.classList.add('hidden');
    dropdown.classList.remove('hidden');
  }

  /**
   * iTunes Search API 직접 호출 (브라우저에서는 차단되지 않음)
   */
  async function searchiTunes(query) {
    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=kr&media=software&limit=10`
      );

      if (!response.ok) {
        console.warn('iTunes API failed:', response.status);
        return [];
      }

      const data = await response.json();

      return (data.results || []).map(app => ({
        appName: app.trackName,
        appStoreUrl: app.trackViewUrl,
        playStoreUrl: null,
        iconImageUrl: app.artworkUrl512 || app.artworkUrl100,
        developer: app.artistName,
        bundleId: app.bundleId,
      }));
    } catch (error) {
      console.error('iTunes search error:', error);
      return [];
    }
  }

  /**
   * 백엔드 Play Store 검색 API 호출
   */
  async function searchPlayStore(apiBaseUrl, query) {
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/apps/search?query=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        console.warn('Play Store API failed:', response.status);
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('Play Store search error:', error);
      return [];
    }
  }

  /**
   * iTunes와 Play Store 검색 결과 병합 (개선된 매칭 로직)
   */
  function mergeSearchResults(iTunesResults, playStoreResults) {
    const merged = [];
    const usedPlayStoreIndices = new Set();

    // iTunes 결과를 기준으로 Play Store 매칭 시도
    iTunesResults.forEach(iTunesApp => {
      const mergedApp = { ...iTunesApp };

      // 매칭되는 Play Store 앱 찾기
      const matchIndex = playStoreResults.findIndex((playApp, idx) => {
        if (usedPlayStoreIndices.has(idx)) return false;
        return isAppMatch(iTunesApp, playApp);
      });

      if (matchIndex !== -1) {
        const playApp = playStoreResults[matchIndex];
        mergedApp.playStoreUrl = playApp.playStoreUrl;
        // Play Store 아이콘이 있고 App Store 아이콘이 없으면 사용
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

  /**
   * 두 앱이 같은 앱인지 판단 (유연한 매칭)
   */
  function isAppMatch(app1, app2) {
    const name1 = normalizeAppName(app1.appName);
    const name2 = normalizeAppName(app2.appName);

    // 1. 정규화된 이름이 정확히 일치
    if (name1 === name2) return true;

    // 2. 기본 이름(부제목 제거) 비교 - "배달의민족 - 무료배민클럽" vs "배달의민족"
    const baseName1 = normalizeAppName(getBaseName(app1.appName));
    const baseName2 = normalizeAppName(getBaseName(app2.appName));
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
      const dev1 = normalizeAppName(app1.developer);
      const dev2 = normalizeAppName(app2.developer);
      if (dev1 === dev2 || dev1.includes(dev2) || dev2.includes(dev1)) {
        // 개발자가 같으면 이름 유사도 체크 (기본 이름 기준)
        if (calculateSimilarity(baseName1, baseName2) > 0.5) {
          return true;
        }
      }
    }

    // 6. 이름 유사도가 매우 높음 (80% 이상)
    if (calculateSimilarity(name1, name2) > 0.8) {
      return true;
    }

    return false;
  }

  /**
   * 앱 이름에서 기본 이름 추출 (부제목 제거)
   * "배달의민족 - 무료배민클럽" -> "배달의민족"
   */
  function getBaseName(name) {
    // 구분자로 분리하여 첫 번째 부분 반환
    const separators = [' - ', ' – ', ' — ', ' : ', ' | ', ':', '|', ' · '];
    for (const sep of separators) {
      if (name.includes(sep)) {
        return name.split(sep)[0].trim();
      }
    }
    return name;
  }

  /**
   * 두 문자열의 유사도 계산 (0~1)
   */
  function calculateSimilarity(str1, str2) {
    if (str1 === str2) return 1;
    if (!str1 || !str2) return 0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    // 공통 문자 수 기반 유사도
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

  /**
   * 앱 이름 정규화 (매칭용)
   */
  function normalizeAppName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '')
      .slice(0, 50);
  }

  function renderDropdown(results) {
    const dropdownItems = document.getElementById('dropdown-items');
    const dropdownMoreEl = document.getElementById('dropdown-more');
    const dropdownMoreBtn = dropdownMoreEl?.querySelector('button');

    if (!results || results.length === 0) {
      dropdownItems.innerHTML = `
        <div class="flex items-center justify-center p-6 text-[#636e88]">
          검색 결과가 없습니다
        </div>
      `;
      if (dropdownMoreEl) dropdownMoreEl.classList.add('hidden');
      dropdown.classList.remove('hidden');
      return;
    }

    // 확장 상태에 따라 표시할 결과 결정
    const displayResults = isExpanded ? results : results.slice(0, INITIAL_LIMIT);
    const hasMoreResults = results.length > INITIAL_LIMIT;

    // 확장 시 스크롤 가능하도록 max-height 설정
    if (isExpanded && hasMoreResults) {
      dropdownItems.style.maxHeight = '400px';
      dropdownItems.style.overflowY = 'auto';
    } else {
      dropdownItems.style.maxHeight = '';
      dropdownItems.style.overflowY = '';
    }

    dropdownItems.innerHTML = displayResults.map(app => `
      <div class="flex items-center gap-4 rounded-lg p-3 hover:bg-primary/5 cursor-pointer transition-colors group/item" data-app='${JSON.stringify(app).replace(/'/g, "&apos;")}'>
        <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-xl size-14 shadow-sm border border-gray-100" style="background-image: url('${app.iconImageUrl}')"></div>
        <div class="flex flex-1 flex-col text-left">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-[#111318] text-base font-bold leading-normal">${app.appName}</p>
            ${app.playStoreUrl ? '<span class="flex items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">PLAY STORE</span>' : ''}
            ${app.appStoreUrl ? '<span class="flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">APP STORE</span>' : ''}
          </div>
          ${app.developer ? `<p class="text-[#636e88] text-sm">${app.developer}</p>` : ''}
        </div>
        <div class="opacity-0 group-hover/item:opacity-100 transition-opacity">
          <span class="material-symbols-outlined text-primary">arrow_forward</span>
        </div>
      </div>
    `).join('');

    // "결과 더 보기" / "접기" 버튼 표시 및 텍스트 업데이트
    if (dropdownMoreEl && dropdownMoreBtn) {
      if (hasMoreResults) {
        dropdownMoreEl.classList.remove('hidden');
        const remainingCount = results.length - INITIAL_LIMIT;
        if (isExpanded) {
          dropdownMoreBtn.innerHTML = `<span class="material-symbols-outlined text-sm align-middle mr-1">expand_less</span>접기`;
        } else {
          dropdownMoreBtn.innerHTML = `결과 더 보기 (+${remainingCount}개)`;
        }
      } else {
        dropdownMoreEl.classList.add('hidden');
      }
    }

    dropdown.classList.remove('hidden');

    dropdownItems.querySelectorAll('[data-app]').forEach(item => {
      item.addEventListener('click', () => {
        const appData = item.dataset.app;
        if (appData) {
          selectedApp = JSON.parse(appData.replace(/&apos;/g, "'"));
          input.value = selectedApp.appName;
          dropdown.classList.add('hidden');
          analyzeBtn.disabled = false;
        }
      });
    });
  }

  function showError() {
    errorMessage.classList.remove('hidden');
    dropdown.classList.add('hidden');
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search')) {
      dropdown.classList.add('hidden');
    }
  });
}
