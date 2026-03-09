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

// Update blog links based on language
const lang = getLang();
const blogBasePath = lang === 'en' ? 'en/' : '';

const blogLinks = {
  'blog-link-1': 'app-market-research-guide.html',
  'blog-link-2': 'playstore-review-analysis.html',
  'blog-link-3': 'competitor-app-analysis.html'
};

Object.entries(blogLinks).forEach(([id, filename]) => {
  const link = document.getElementById(id);
  if (link) {
    link.href = blogBasePath + filename;
  }
});
