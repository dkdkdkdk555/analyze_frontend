import { initSearchBar } from './components/search-bar.js';
import { initHeader } from './components/header.js';
import { initFooter } from './components/footer.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';
const AB_TEXT = 'default_v1';

// 페이지 노출 이벤트 전송 (A/B 테스트 추적)
async function sendExposureEvent() {
  try {
    await fetch(`${API_BASE_URL}/api/events/exposure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abText: AB_TEXT })
    });
  } catch (error) {
    console.error('Exposure event error:', error);
  }
}

// Send exposure event on page load
sendExposureEvent();

initHeader({ page: 'index', apiBaseUrl: API_BASE_URL });
initFooter();
initSearchBar(API_BASE_URL);
