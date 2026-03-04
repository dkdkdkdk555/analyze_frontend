import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { applyTranslations, t } from '../components/i18n.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';

document.title = t('services.page_title');
initHeader({ page: 'services', apiBaseUrl: API_BASE_URL });
initFooter();
applyTranslations();

async function checkGroupAnalysisFeature() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/features`);
    const data = await res.json();
    return data.groupAnalysis === true;
  } catch {
    return false;
  }
}

document.getElementById('group-analysis-start-btn')?.addEventListener('click', async () => {
  const enabled = await checkGroupAnalysisFeature();
  if (!enabled) {
    document.getElementById('coming-soon-modal')?.classList.remove('hidden');
    return;
  }
  location.href = '/analysis/group-analysis.html';
});

document.getElementById('close-coming-soon-modal')?.addEventListener('click', () => {
  document.getElementById('coming-soon-modal')?.classList.add('hidden');
});
