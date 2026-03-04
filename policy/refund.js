import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { getLang, applyTranslations, t } from '../components/i18n.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';

document.title = t('refund.page_title');
initHeader({ page: '', apiBaseUrl: API_BASE_URL });
initFooter();
applyTranslations();

const lang = getLang();
console.log('[refund] lang =', lang);

try {
  const res = await fetch(`/assets/policy/${lang}/refund.md`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const md = await res.text();
  document.getElementById('policy-content').innerHTML = marked.parse(md);
} catch (err) {
  console.error('[refund] Failed to load policy content:', err);
  document.getElementById('policy-content').innerHTML =
    `<p class="text-red-500">Failed to load content (lang: ${lang}). Error: ${err.message}</p>`;
}
