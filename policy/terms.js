import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { getLang, applyTranslations, t } from '../components/i18n.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';

document.title = t('terms.page_title');
initHeader({ page: '', apiBaseUrl: API_BASE_URL });
initFooter();
applyTranslations();

const lang = getLang();
console.log('[terms] lang =', lang);

try {
  const res = await fetch(`/assets/policy/${lang}/terms.md`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const md = await res.text();
  document.getElementById('policy-content').innerHTML = marked.parse(md);
} catch (err) {
  console.error('[terms] Failed to load policy content:', err);
  document.getElementById('policy-content').innerHTML =
    `<p class="text-red-500">Failed to load content (lang: ${lang}). Error: ${err.message}</p>`;
}
