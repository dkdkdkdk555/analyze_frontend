let debounceTimer;

export function initSearchBar(apiBaseUrl) {
  const input = document.getElementById('search-input');
  const dropdown = document.getElementById('search-dropdown');
  const analyzeBtn = document.getElementById('analyze-btn');
  const errorMessage = document.getElementById('error-message');

  let selectedApp = null;

  input.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => searchApps(e.target.value), 300);
  });

  analyzeBtn.addEventListener('click', () => {
    if (selectedApp) {
      const params = new URLSearchParams();
      if (selectedApp.appStoreUrl) params.set('appStoreUrl', selectedApp.appStoreUrl);
      if (selectedApp.playStoreUrl) params.set('playStoreUrl', selectedApp.playStoreUrl);
      window.location.href = `/analysis.html?${params.toString()}`;
    }
  });

  async function searchApps(query) {
    if (!query || query.trim().length < 2) {
      dropdown.classList.add('hidden');
      return;
    }

    try {
      errorMessage.classList.add('hidden');
      const response = await fetch(`${apiBaseUrl}/api/apps/search?query=${encodeURIComponent(query)}`);

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results = await response.json();
      renderDropdown(results);
    } catch (error) {
      console.error('Search error:', error);
      showError();
    }
  }

  function renderDropdown(results) {
    const dropdownItems = document.getElementById('dropdown-items');
    const dropdownMore = document.getElementById('dropdown-more');

    if (!results || results.length === 0) {
      dropdownItems.innerHTML = `
        <div class="flex items-center justify-center p-6 text-[#636e88]">
          검색 결과가 없습니다
        </div>
      `;
      if (dropdownMore) dropdownMore.classList.add('hidden');
      dropdown.classList.remove('hidden');
      return;
    }

    dropdownItems.innerHTML = results.map(app => `
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

    if (dropdownMore) {
      if (results.length > 3) {
        dropdownMore.classList.remove('hidden');
      } else {
        dropdownMore.classList.add('hidden');
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
