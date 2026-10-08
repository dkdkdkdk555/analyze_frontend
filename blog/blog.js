import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { getLang, applyTranslations, t } from '../components/i18n.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';

initHeader({ page: 'blog', apiBaseUrl: API_BASE_URL });
initFooter();

// Apply translations
applyTranslations();

// Update page title
document.title = t('blog.page_title');

// Static HTML links point to the English (canonical) posts; swap to the Korean posts for Korean readers
const lang = getLang();
const blogBasePath = lang === 'ko' ? '/blog/' : '/blog/en/';

const blogLinks = {
  'blog-link-1': 'app-market-research-guide',
  'blog-link-2': 'playstore-review-analysis',
  'blog-link-3': 'competitor-app-analysis'
};

Object.entries(blogLinks).forEach(([id, slug]) => {
  const link = document.getElementById(id);
  if (link) {
    link.href = blogBasePath + slug;
  }
});
