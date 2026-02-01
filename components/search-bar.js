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
    if (!results || results.length === 0) {
      dropdown.innerHTML = '<div class="dropdown-item">검색 결과가 없습니다</div>';
      dropdown.classList.remove('hidden');
      return;
    }

    dropdown.innerHTML = results.map(app => `
      <div class="dropdown-item" data-app='${JSON.stringify(app).replace(/'/g, "&apos;")}'>
        <img class="app-icon" src="${app.iconImageUrl}" alt="${app.appName}" />
        <span class="app-name">${app.appName}</span>
        <div class="store-icons">
          ${app.appStoreUrl ? '<img src="../assets/images/app-store-icon.svg" alt="App Store" />' : ''}
          ${app.playStoreUrl ? '<img src="../assets/images/google-play-icon.svg" alt="Google Play" />' : ''}
        </div>
      </div>
    `).join('');

    dropdown.classList.remove('hidden');

    dropdown.querySelectorAll('.dropdown-item').forEach(item => {
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
