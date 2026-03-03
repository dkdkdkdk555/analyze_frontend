import { initHeader } from './components/header.js';
import { initFooter } from './components/footer.js';
import { getLang, applyTranslations, t } from './components/i18n.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';

document.title = t('privacy.page_title');
initHeader({ page: '', apiBaseUrl: API_BASE_URL });
initFooter();
applyTranslations();

const lang = getLang();
const res = await fetch(`/assets/policy/${lang}/privacy.md`);
const md = await res.text();
document.getElementById('policy-content').innerHTML = marked.parse(md);
