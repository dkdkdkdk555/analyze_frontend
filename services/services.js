import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { applyTranslations, t } from '../components/i18n.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';

document.title = t('services.page_title');
initHeader({ page: 'services', apiBaseUrl: API_BASE_URL });
initFooter();
applyTranslations();

document.getElementById('group-analysis-start-btn')?.addEventListener('click', () => {
  location.href = '/analysis/group-analysis.html';
});
